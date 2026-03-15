declare module "pdf-parse" {
  const pdfParse: (input: Uint8Array | Buffer) => Promise<{ text: string }>;
  export default pdfParse;
}
