// Builds battery-calculator-offline.html from public/: one self-contained file
// (CSS, JS and icons inlined, no service worker) that opens straight from a
// phone's file manager with no server or connection.
var fs = require("fs");
var path = require("path");

var root = path.join(__dirname, "..");
function read(p) { return fs.readFileSync(path.join(root, "public", p), "utf8"); }
function svgUri(svg) { return "data:image/svg+xml," + encodeURIComponent(svg.trim()); }

var icon = svgUri(read("icon.svg"));
var manifest = JSON.parse(read("manifest.webmanifest"));
manifest.start_url = ".";
delete manifest.scope;
manifest.icons = [{ src: icon, sizes: "512x512", type: "image/svg+xml" }];

var js = read("app.js").replace(/\nif \("serviceWorker" in navigator\)[\s\S]*$/, "\n");
var html = read("index.html");

// Function replacements so "$" sequences in the CSS/JS are inserted literally.
[
  [/<link rel="manifest"[^>]*>/, '<link rel="manifest" href="data:application/manifest+json,' + encodeURIComponent(JSON.stringify(manifest)) + '">'],
  [/<link rel="icon"[^>]*>/, '<link rel="icon" href="' + icon + '">'],
  [/<link rel="apple-touch-icon"[^>]*>/, '<link rel="apple-touch-icon" href="' + icon + '">'],
  [/<link rel="stylesheet"[^>]*>/, "<style>\n" + read("styles.css") + "</style>"],
  [/<script src="\/app\.js"[^>]*><\/script>\n/, ""],
  [/<\/body>/, "<script>\n" + js + "</script>\n</body>"]
].forEach(function (r) {
  if (!r[0].test(html)) throw new Error("build-offline: no match for " + r[0]);
  html = html.replace(r[0], function () { return r[1]; });
});

fs.writeFileSync(path.join(root, "battery-calculator-offline.html"), html);
console.log("Wrote battery-calculator-offline.html (" + Math.round(html.length / 1024) + " KB)");
