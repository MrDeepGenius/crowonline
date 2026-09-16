"use client";

export function ErrorBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-crow-danger/30 bg-crow-danger/10 px-3.5 py-2.5 text-[12.5px] text-crow-danger">
      {message}
    </p>
  );
}

export function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <span className="mt-1 block text-[11px] text-crow-danger">{errors[0]}</span>;
}

export function SuccessBox({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="rounded-xl border border-crow-success/30 bg-crow-success/10 px-3.5 py-2.5 text-[12.5px] text-crow-success">
      {message}
    </p>
  );
}