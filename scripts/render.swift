// Render every page of a PDF to JPEG.
// usage: swift scripts/render.swift <pdf> <outDir> [widthPx=1800]
import PDFKit
import AppKit

let args = CommandLine.arguments
guard args.count >= 3, let doc = PDFDocument(url: URL(fileURLWithPath: args[1])) else {
  print("usage: swift scripts/render.swift <pdf> <outDir> [widthPx]"); exit(1)
}
let outDir = args[2]
let width = CGFloat(Double(args.count > 3 ? args[3] : "1800") ?? 1800)
for i in 0..<doc.pageCount {
  let page = doc.page(at: i)!
  let box = page.bounds(for: .mediaBox)
  let scale = width / box.width
  let img = page.thumbnail(of: NSSize(width: box.width * scale, height: box.height * scale), for: .mediaBox)
  let rep = NSBitmapImageRep(data: img.tiffRepresentation!)!
  let data = rep.representation(using: .jpeg, properties: [.compressionFactor: 0.85])!
  try! data.write(to: URL(fileURLWithPath: String(format: "%@/p%03d.jpg", outDir, i + 1)))
}
print("rendered \(doc.pageCount) pages → \(outDir)")
