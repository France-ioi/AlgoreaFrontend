export function downloadFile(data: BlobPart[], fileName: string, type: string): void {
  const file = new Blob(data, { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(file);
  a.download = fileName;
  a.click();
}
