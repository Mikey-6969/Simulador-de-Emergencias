"use client";

export function PrintButton() {
  return (
    <button className="mila-btn mila-btn-primary" onClick={() => window.print()}>
      Imprimir / guardar PDF
    </button>
  );
}
