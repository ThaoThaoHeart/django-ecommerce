import { useId } from "react";

export function Field({ label, errors, type = "text", ...inputAttributes }) {
  const id = useId();
  if (type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2 text-sm font-medium text-gray-700">
        <input type="checkbox" className="h-4 w-4 accent-red-600" {...inputAttributes} />
        {label}
      </label>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <input id={id} type={type} className="input" aria-invalid={errors ? true : undefined} {...inputAttributes} />
      <FieldErrors errors={errors} />
    </div>
  );
}

export function FieldErrors({ errors }) {
  return errors?.map((message) => <p key={message} className="mt-1 text-sm text-red-600">{message}</p>) ?? null;
}

export function FieldGroup({ fields, values, errors = {}, onChange, className = "space-y-4" }) {
  return (
    <div className={className}>
      <FieldErrors errors={errors.__all__} />
      {fields.map(({ name, className: fieldClassName, ...fieldAttributes }) => (
        <div key={name} className={fieldClassName}>
          <Field
            name={name}
            value={values[name] ?? ""}
            onChange={(event) => onChange({ ...values, [name]: event.target.value })}
            errors={errors[name]}
            {...fieldAttributes}
          />
        </div>
      ))}
    </div>
  );
}
