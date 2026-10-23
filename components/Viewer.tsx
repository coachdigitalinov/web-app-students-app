/** Read-only inline viewer. Files are served inline with no-store and never offered as a download link. */
export function Viewer({ src, mime, title }: { src: string; mime: string; title: string }) {
  return mime.startsWith("image/")
    // eslint-disable-next-line @next/next/no-img-element
    ? <img className="sheet" src={src} alt={title} />
    : <iframe className="viewer" src={`${src}#toolbar=0&navpanes=0`} title={title} />;
}
