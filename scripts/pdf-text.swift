// Extract the text layer of every PDF page (OCR'd scans) — cheap input for transcription agents.
// usage: swift scripts/pdf-text.swift <pdf> <outDir>   → <outDir>/p###.txt
import PDFKit
let a = CommandLine.arguments
guard a.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: a[1])) else { print("usage: swift scripts/pdf-text.swift <pdf> <outDir>"); exit(1) }
try? FileManager.default.createDirectory(atPath: a[2], withIntermediateDirectories: true)
for i in 0..<doc.pageCount {
  let s = doc.page(at: i)?.string ?? ""
  try! s.write(toFile: String(format: "%@/p%03d.txt", a[2], i + 1), atomically: true, encoding: .utf8)
}
print("extracted \(doc.pageCount) pages → \(a[2])")
