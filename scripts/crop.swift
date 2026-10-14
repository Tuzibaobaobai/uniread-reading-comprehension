// Crop a region from a rendered page image (coordinates are fractions 0–1 of the page).
// usage: swift scripts/crop.swift <page.jpg> <out.jpg> <x> <y> <w> <h> [maxWidth=1200]
import AppKit

let a = CommandLine.arguments
guard a.count >= 7, let src = NSImage(contentsOfFile: a[1]),
      let cg = src.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
  print("usage: swift scripts/crop.swift <page.jpg> <out.jpg> <x> <y> <w> <h> [maxWidth]"); exit(1)
}
let W = Double(cg.width), H = Double(cg.height)
let (fx, fy, fw, fh) = (Double(a[3])!, Double(a[4])!, Double(a[5])!, Double(a[6])!)
let rect = CGRect(x: fx * W, y: fy * H, width: fw * W, height: fh * H).integral
guard let cropped = cg.cropping(to: rect) else { print("bad rect"); exit(1) }
let maxW = Double(a.count > 7 ? a[7] : "1200")!
let scale = min(1.0, maxW / Double(cropped.width))
let ow = Int(Double(cropped.width) * scale), oh = Int(Double(cropped.height) * scale)
let ctx = CGContext(data: nil, width: ow, height: oh, bitsPerComponent: 8, bytesPerRow: 0,
                    space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.interpolationQuality = .high
ctx.draw(cropped, in: CGRect(x: 0, y: 0, width: ow, height: oh))
let rep = NSBitmapImageRep(cgImage: ctx.makeImage()!)
try! rep.representation(using: .jpeg, properties: [.compressionFactor: 0.85])!.write(to: URL(fileURLWithPath: a[2]))
print("\(a[2]) \(ow)x\(oh)")
