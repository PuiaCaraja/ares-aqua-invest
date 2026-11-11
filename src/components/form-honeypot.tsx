export function FormHoneypot() {
  return (
    <div hidden aria-hidden="true">
      <label>
        Deixe este campo vazio
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}
