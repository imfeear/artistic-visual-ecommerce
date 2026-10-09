import { useId, useState } from 'react';
import { FiUploadCloud, FiX, FiSave } from 'react-icons/fi';
import { Button, Modal, ProductImage } from './ui';
import { uploadImage } from '../lib/api';
import { useAuth } from '../auth/useAuth';
import { AVAILABILITIES, CATEGORIES, MATERIALS, availabilityOf, isCategory } from '../lib/catalog';

export default function ProductEditor({ product, onClose, onSave }) {
  const { auth } = useAuth();
  const categoryHelpId = useId();
  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price ?? '',
    imageUrl: product?.imageUrl || '',
    category: isCategory(product?.category) ? product.category : '',
    availability: product ? availabilityOf(product) : 'available',
    materials: product?.materials || [],
    featured: product?.featured === true,
  });
  const [customMaterial, setCustomMaterial] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const change = (e) =>
    setForm((s) => ({
      ...s,
      [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));
  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const result = await uploadImage(file, auth);
      setForm((s) => ({ ...s, imageUrl: result.url || result.path || result }));
      setFileName(file.name);
    } catch (err) {
      setError(`Falha no upload: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };
  const submit = async (e) => {
    e.preventDefault();
    if (saving || uploading) return;
    if (!isCategory(form.category)) {
      setError('Selecione uma categoria para o produto.');
      return;
    }
    if (!form.name.trim()) {
      setError('Informe o nome da peça.');
      return;
    }
    if (form.price === '' || !Number.isFinite(Number(form.price)) || Number(form.price) < 0) {
      setError('Informe um preço válido.');
      return;
    }
    const pending = customMaterial.trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
    const materials = [...new Set([...form.materials, ...(pending ? [pending] : [])])];
    if (materials.length > 12) {
      setError('Cadastre até 12 materiais ou técnicas.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...form,
        materials,
        available: form.availability !== 'sold-out',
        name: form.name.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl.trim(),
        price: Number(form.price),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      busy={saving || uploading}
      title={product ? 'Editar peça' : 'Uma nova peça na coleção'}
      description="Os detalhes fazem a diferença. Apresente sua arte com cuidado."
      className="editor-dialog"
    >
      <form onSubmit={submit} className="editor-form">
        <div className="editor-grid">
          <div className="editor-fields">
            <label className="field">
              Nome da peça <span>*</span>
              <input
                name="name"
                required
                maxLength={160}
                value={form.name}
                onChange={change}
                placeholder="Como sua peça se chama?"
                autoFocus
              />
            </label>
            <label className="field">
              Descrição
              <textarea
                name="description"
                rows={4}
                value={form.description}
                onChange={change}
                placeholder="Conte sobre a peça, os materiais e a inspiração…"
              />
            </label>
            <label className="field">
              Categoria
              <select
                name="category"
                required
                value={form.category}
                aria-describedby={
                  product && !isCategory(product.category) ? categoryHelpId : undefined
                }
                onChange={change}
                onInvalid={() => setError('Selecione uma categoria para o produto.')}
              >
                <option value="" disabled>
                  Selecione uma categoria
                </option>
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            {product && !isCategory(product.category) && (
              <p className="filter-help" id={categoryHelpId}>
                Esta peça está sem uma categoria válida. Selecione uma antes de salvar.
              </p>
            )}
            <label className="field">
              Disponibilidade
              <select name="availability" value={form.availability} onChange={change}>
                {AVAILABILITIES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              Preço (R$) <span>*</span>
              <input
                name="price"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.price}
                onChange={change}
                placeholder="0,00"
              />
            </label>
            <label className="availability-field">
              <input name="featured" type="checkbox" checked={form.featured} onChange={change} />
              <span>
                <strong>Destacar esta peça</strong>
                <small>Prioriza o produto na ordenação por destaque.</small>
              </span>
            </label>
          </div>
          <div className="editor-media">
            <div className="editor-preview">
              {form.imageUrl ? (
                <>
                  <ProductImage src={form.imageUrl} alt="Pré-visualização da peça" />
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => {
                      setForm((s) => ({ ...s, imageUrl: '' }));
                      setFileName('');
                    }}
                    aria-label="Remover imagem"
                  >
                    <FiX />
                  </button>
                </>
              ) : (
                <div>
                  <FiUploadCloud />
                  <span>A imagem da sua peça</span>
                  <small>Uma boa imagem valoriza cada detalhe.</small>
                </div>
              )}
            </div>
            <label className={`upload-button ${uploading ? 'is-uploading' : ''}`}>
              <input
                type="file"
                accept="image/*"
                onChange={upload}
                disabled={saving || uploading}
              />
              <FiUploadCloud />
              {uploading ? 'Enviando imagem…' : 'Escolher arquivo'}
            </label>
            {fileName && <p className="file-name">{fileName}</p>}
            <label className="field">
              Ou use uma URL
              <input
                name="imageUrl"
                value={form.imageUrl}
                onChange={change}
                placeholder="https://… ou /uploads/…"
              />
            </label>
            <fieldset className="editor-materials">
              <legend>Materiais & técnicas</legend>
              <p>Selecione os materiais utilizados. Eles ficam disponíveis nos filtros da loja.</p>
              <div className="material-options">
                {[...new Set([...MATERIALS, ...form.materials])].map((material) => (
                  <label className="catalog-check" key={material}>
                    <input
                      type="checkbox"
                      checked={form.materials.includes(material)}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          materials: current.materials.includes(material)
                            ? current.materials.filter((item) => item !== material)
                            : [...current.materials, material],
                        }))
                      }
                    />
                    <span>{material.charAt(0).toUpperCase() + material.slice(1)}</span>
                  </label>
                ))}
              </div>
              <label className="field">
                Outro material ou técnica
                <input
                  maxLength={80}
                  value={customMaterial}
                  onChange={(event) => setCustomMaterial(event.target.value)}
                  placeholder="Ex.: madeira, bordado…"
                />
              </label>
              <Button
                variant="secondary"
                disabled={!customMaterial.trim() || form.materials.length >= 12}
                onClick={() => {
                  const material = customMaterial
                    .trim()
                    .replace(/\s+/g, ' ')
                    .toLocaleLowerCase('pt-BR');
                  setForm((current) => ({
                    ...current,
                    materials: [...new Set([...current.materials, material])],
                  }));
                  setCustomMaterial('');
                }}
              >
                Adicionar material
              </Button>
            </fieldset>
          </div>
        </div>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <Button variant="secondary" disabled={saving || uploading} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" busy={saving} disabled={uploading}>
            <FiSave />
            {product ? 'Salvar alterações' : 'Criar produto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
