import { useCallback, useState } from 'react';
import { FiPlus, FiArrowUp, FiArrowDown, FiTrash2, FiUploadCloud, FiSave } from 'react-icons/fi';
import { listCarouselAdmin, saveCarousel, uploadImage } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import useResource from '../hooks/useResource';
import { Button, Badge, EmptyState, Modal, ProductImage } from './ui';

function CarouselEditor({ onClose }) {
  const { auth } = useAuth();
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState('');
  const [error, setError] = useState('');
  const loader = useCallback(async () => {
    const data = await listCarouselAdmin(auth);
    setItems(
      (Array.isArray(data) ? data : [])
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((item) => ({ ...item, key: crypto.randomUUID() })),
    );
    return data;
  }, [auth]);
  const resource = useResource(loader);
  const busy = saving || Boolean(uploading);
  const change = (key, patch) =>
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)));
  const move = (index, dir) =>
    setItems((prev) => {
      const copy = [...prev];
      [copy[index], copy[index + dir]] = [copy[index + dir], copy[index]];
      return copy;
    });
  const upload = async (key, file) => {
    if (!file) return;
    setUploading(key);
    setError('');
    try {
      const result = await uploadImage(file, auth);
      change(key, { url: result.url || result.path || result });
    } catch (err) {
      setError(`Falha no upload: ${err.message}`);
    } finally {
      setUploading('');
    }
  };
  const save = async () => {
    if (items.some((item) => !item.url?.trim())) {
      setError('Adicione uma imagem a cada banner ou remova os espaços vazios.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await saveCarousel(
        items.map((item, i) => ({
          url: item.url.trim(),
          position: i + 1,
          active: Boolean(item.active),
        })),
        auth,
      );
      localStorage.setItem('carousel:refresh', String(Date.now()));
      onClose(true);
    } catch (err) {
      setError(`Não foi possível salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={() => onClose(false)}
      busy={busy}
      title="Editar carrossel"
      description="Adicione imagens, organize a sequência e escolha o que fica visível."
      className="carousel-dialog"
    >
      {resource.loading ? (
        <div className="skeleton chart-skeleton" />
      ) : resource.error ? (
        <EmptyState
          error
          title="Não foi possível carregar os banners"
          description={resource.error}
          action={<Button onClick={resource.refresh}>Tentar novamente</Button>}
        />
      ) : (
        <>
          <div className="banner-editor-list">
            {items.length === 0 && (
              <EmptyState
                title="Uma vitrine em branco"
                description="Adicione a primeira imagem para começar."
              />
            )}
            {items.map((item, i) => (
              <div className="banner-editor-row" key={item.key}>
                <div className="banner-editor-preview">
                  {item.url ? (
                    <ProductImage src={item.url} alt={`Prévia do banner ${i + 1}`} />
                  ) : (
                    <FiUploadCloud />
                  )}
                </div>
                <div className="banner-editor-fields">
                  <div className="banner-editor-title">
                    <strong>Banner {String(i + 1).padStart(2, '0')}</strong>
                    <Badge tone={item.active ? 'success' : 'neutral'}>
                      {item.active ? 'Visível' : 'Oculto'}
                    </Badge>
                    <div className="banner-order">
                      <button
                        className="icon-btn"
                        disabled={busy || i === 0}
                        onClick={() => move(i, -1)}
                        aria-label={`Subir banner ${i + 1}`}
                      >
                        <FiArrowUp />
                      </button>
                      <button
                        className="icon-btn"
                        disabled={busy || i === items.length - 1}
                        onClick={() => move(i, 1)}
                        aria-label={`Descer banner ${i + 1}`}
                      >
                        <FiArrowDown />
                      </button>
                      <button
                        className="icon-btn danger-icon"
                        disabled={busy}
                        onClick={() => setItems((prev) => prev.filter((x) => x.key !== item.key))}
                        aria-label={`Remover banner ${i + 1}`}
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>
                  <label className="field">
                    URL da imagem
                    <input
                      value={item.url || ''}
                      onChange={(e) => change(item.key, { url: e.target.value })}
                      disabled={busy}
                      placeholder="https://… ou /uploads/…"
                    />
                  </label>
                  <div className="banner-upload-row">
                    <label className="upload-button">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={busy}
                        onChange={(e) => upload(item.key, e.target.files?.[0])}
                      />
                      <FiUploadCloud />
                      {uploading === item.key ? 'Enviando…' : 'Enviar imagem'}
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={Boolean(item.active)}
                        disabled={busy}
                        onChange={(e) => change(item.key, { active: e.target.checked })}
                      />
                      Ativo
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() =>
              setItems((prev) => [...prev, { key: crypto.randomUUID(), url: '', active: true }])
            }
          >
            <FiPlus /> Adicionar banner
          </Button>
        </>
      )}
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <Button variant="secondary" disabled={busy} onClick={() => onClose(false)}>
          Cancelar
        </Button>
        <Button
          busy={saving}
          disabled={resource.loading || Boolean(resource.error) || Boolean(uploading)}
          onClick={save}
        >
          <FiSave /> Salvar carrossel
        </Button>
      </div>
    </Modal>
  );
}
export default function CarouselModal({ open, onClose }) {
  return open ? <CarouselEditor onClose={onClose} /> : null;
}
