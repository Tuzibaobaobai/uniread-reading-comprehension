// OCR rendered page images with macOS Vision (local, no API cost).
// usage: swift scripts/ocr.swift <pagesDir> <outDir> [zh]  → <outDir>/p###.txt, one line per text line:
//   "<y> <x> <confidence> <text>"  (y, x = top-left as fractions of the page, 0 = top/left)
//   zh: Chinese-first recognition (Vision reads Chinese only when zh-Hans is the first language; it still reads English)
import Vision
import AppKit

let a = CommandLine.arguments
guard a.count >= 3 else { print("usage: swift scripts/ocr.swift <pagesDir> <outDir> [zh]"); exit(1) }
let chineseFirst = a.count > 3 && a[3] == "zh"
let fm = FileManager.default
try? fm.createDirectory(atPath: a[2], withIntermediateDirectories: true)
let pages = try! fm.contentsOfDirectory(atPath: a[1]).filter { $0.hasSuffix(".jpg") }.sorted()
for name in pages {
  guard let img = NSImage(contentsOfFile: "\(a[1])/\(name)"),
        let cg = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else { continue }
  let req = VNRecognizeTextRequest()
  req.recognitionLevel = .accurate
  req.recognitionLanguages = chineseFirst ? ["zh-Hans", "en-US"] : ["en-US"]
  req.usesLanguageCorrection = false
  try! VNImageRequestHandler(cgImage: cg).perform([req])
  let lines = (req.results ?? []).compactMap { o -> (Double, Double, String)? in
    guard let c = o.topCandidates(1).first else { return nil }
    let b = o.boundingBox
    return (1 - Double(b.maxY), Double(b.minX), String(format: "%.3f %.3f %.2f %@", 1 - b.maxY, b.minX, c.confidence, c.string))
  }.sorted { abs($0.0 - $1.0) > 0.006 ? $0.0 < $1.0 : $0.1 < $1.1 }
  let out = "\(a[2])/\(name.replacingOccurrences(of: ".jpg", with: ".txt"))"
  try! lines.map { $0.2 }.joined(separator: "\n").write(toFile: out, atomically: true, encoding: .utf8)
}
print("ocr \(pages.count) pages → \(a[2])")
