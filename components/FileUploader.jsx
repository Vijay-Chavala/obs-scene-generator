export function FileUploader({ onText }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">
      <div className="text-sm font-medium">Upload lyrics (.txt)</div>
      <input
        className="mt-2 block w-full text-sm"
        type="file"
        accept=".txt,text/plain"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const text = await f.text();
          onText(text);
        }}
      />
    </div>
  );
}

