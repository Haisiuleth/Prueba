import { useEffect, useRef, useState } from 'react';
import type { FormEvent, ChangeEvent, ReactNode } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { ME, UPDATE_USER } from '../api/user';
import type { MeData } from '../api/user';
import '../css/profile.css';

type FormState = { name: string; lastName: string; email: string };
type Errors = Partial<Record<keyof FormState, string>>;
type Toast = { type: 'ok' | 'error'; text: string } | null;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f: FormState): Errors {
  const errors: Errors = {};
  if (f.name.trim().length < 2) errors.name = 'Escribe tu nombre (mínimo 2 letras)';
  if (f.lastName.trim().length < 2) errors.lastName = 'Escribe tu apellido (mínimo 2 letras)';
  if (!f.email.trim()) errors.email = 'Escribe tu correo electrónico';
  else if (!EMAIL_RE.test(f.email.trim())) errors.email = 'Ese correo no es válido, revisa que tenga @ y dominio';
  return errors;
}

const Svg = ({ children }: { children: ReactNode }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
const IconUser = () => <Svg><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></Svg>;
const IconMail = () => <Svg><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>;
const IconPencil = () => <Svg><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></Svg>;

type FieldProps = {
  id: string; label: string; icon: ReactNode; value: string; editing: boolean;
  error?: string; type?: string; autoComplete?: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void; onBlur: () => void;
  inputRef?: React.Ref<HTMLInputElement>;
};

function Field({ id, label, icon, value, editing, error, type = 'text', autoComplete, onChange, onBlur, inputRef }: FieldProps) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="field__wrap">
        <span className="field__icon">{icon}</span>
        <input
          id={id} ref={inputRef} type={type} className="input" value={value}
          onChange={onChange} onBlur={onBlur} disabled={!editing} autoComplete={autoComplete}
          inputMode={type === 'email' ? 'email' : undefined}
          aria-invalid={!!error} aria-describedby={error ? `${id}-err` : undefined}
        />
      </div>
      {error && <span id={`${id}-err`} className="field__error">{error}</span>}
    </div>
  );
}

export default function Profile() {
  const { data, loading, error } = useQuery<MeData>(ME);
  const [updateUser, { loading: saving }] = useMutation(UPDATE_USER);

  const [saved, setSaved] = useState<FormState>({ name: '', lastName: '', email: '' });
  const [form, setForm] = useState<FormState>(saved);
  const [editing, setEditing] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof FormState, boolean>>>({});
  const [toast, setToast] = useState<Toast>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (data?.me) {
      const { name, lastName, email } = data.me;
      const next = { name, lastName, email };
      setSaved(next);
      setForm(next);
    }
  }, [data]);

  useEffect(() => {
    if (editing) nameRef.current?.focus();
  }, [editing]);

  useEffect(() => () => window.clearTimeout(toastTimer.current), []);

  const showToast = (t: NonNullable<Toast>) => {
    window.clearTimeout(toastTimer.current);
    setToast(t);
    toastTimer.current = window.setTimeout(() => setToast(null), 3500);
  };

  const errors = validate(form);
  const isDirty = (Object.keys(form) as (keyof FormState)[]).some((k) => form[k].trim() !== saved[k]);
  const canSave = isDirty && Object.keys(errors).length === 0 && !saving;

  const onChange = (field: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));
  const onBlur = (field: keyof FormState) => () => setTouched((t) => ({ ...t, [field]: true }));

  const cancelEdit = () => {
    setForm(saved);
    setTouched({});
    setEditing(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, lastName: true, email: true });
    if (Object.keys(errors).length > 0) return;

    const input = { name: form.name.trim(), lastName: form.lastName.trim(), email: form.email.trim() };
    try {
      await updateUser({ variables: { input } });
      setSaved(input);
      setForm(input);
      setTouched({});
      setEditing(false);
      showToast({ type: 'ok', text: 'Datos guardados correctamente' });
    } catch {
      showToast({ type: 'error', text: 'No se pudieron guardar los cambios. Intenta de nuevo' });
    }
  };

  if (loading)
    return (
      <div className="loader" role="status">
        <div className="spinner" /> Cargando perfil...
      </div>
    );

  if (error || !data?.me)
    return (
      <div className="empty-state">
        <p className="empty-state__message" role="alert">No se pudo cargar el perfil</p>
        <button className="btn btn-primary" onClick={() => window.location.reload()}>Reintentar</button>
      </div>
    );

  const { username, userType, createdAt } = data.me;
  const created = new Date(createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' });
  const fieldError = (k: keyof FormState) => (editing && touched[k] ? errors[k] : undefined);

  return (
    <section className="profile">

      <form onSubmit={onSubmit} className="profile__card" noValidate data-editing={editing}>
        <div className="profile__cover" aria-hidden="true" />

        <header className="profile__head">
     
          <h1 className="profile__title">Gestiona tu perfil</h1>
        </header>

        <dl className="profile__stats">
          <div><dt>Usuario</dt><dd>@{username}</dd></div>
          <div><dt>Tipo de usuario</dt><dd>{userType}</dd></div>
          <div><dt>Miembro desde</dt><dd>{created}</dd></div>
        </dl>

        <div className="profile__body">
          <div className="profile__section">
            <h2>Mis datos</h2>
            {editing ? (
              <span className="profile__editing">{isDirty ? 'Cambios sin guardar' : 'Editando'}</span>
            ) : (
              <button type="button" className="btn-edit" onClick={() => setEditing(true)}>
                <IconPencil /> Editar
              </button>
            )}
          </div>

          <div className="profile__fields">
            <div className="grid-2">
              <Field id="name" label="Nombre" icon={<IconUser />} value={form.name} editing={editing}
                autoComplete="given-name" error={fieldError('name')} inputRef={nameRef}
                onChange={onChange('name')} onBlur={onBlur('name')} />
              <Field id="lastName" label="Apellido" icon={<IconUser />} value={form.lastName} editing={editing}
                autoComplete="family-name" error={fieldError('lastName')}
                onChange={onChange('lastName')} onBlur={onBlur('lastName')} />
            </div>
            <Field id="email" label="Correo electrónico" icon={<IconMail />} type="email" value={form.email}
              editing={editing} autoComplete="email" error={fieldError('email')}
              onChange={onChange('email')} onBlur={onBlur('email')} />
          </div>

          {editing && (
            <footer className="profile__actions">
              <button type="button" className="btn btn-ghost" onClick={cancelEdit} disabled={saving}>Cancelar</button>
              <button type="submit" className="btn btn-accent" disabled={!canSave}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </footer>
          )}
        </div>
      </form>

      {toast && (
        <div className={`toast toast--${toast.type}`} role={toast.type === 'error' ? 'alert' : 'status'}
          onClick={() => setToast(null)}>
          <span className="toast__icon" aria-hidden="true">{toast.type === 'ok' ? '✓' : '!'}</span>
          {toast.text}
        </div>
      )}
    </section>
  );
}