class SVGHelper {
  constructor(svg) {
    // Just create a document fragment to parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "text/html");
    this.shadowRoot = doc;
  }
}

class StenoViz extends HTMLElement {
  static outline_regex =
    /^(?<num>#)?(?:(?<ls>S)?(?<lt>T)?(?<lk>K)?(?<lp>P)?(?<lw>W)?(?<lh>H)?(?<lr>R)?)?(?:(?<la>A)?(?<lo>O)?)?(?<star>\*)?(?:(?<re>E)?(?<ru>U)?(?:-)?)?(?:(?<rf>F)?(?<rr>R)?(?<rp>P)?(?<rb>B)?(?<rl>L)?(?<rg>G)?(?<rt>T)?(?<rs>S)?(?<rd>D)?(?<rz>Z)?)?$/;
  static steno_outline_svg_cache = null;
  static steno_outline_pressed_svg_cache = null;

  static observedAttributes = [
    "stroke",
    "steno_outline",
    "steno_outline_pressed",
  ];

  get stroke() {
    return this.getAttribute("stroke");
  }

  async steno_outline() {
    if (this.getAttribute("steno_outline")) {
      const response = await fetch(this.getAttribute("steno_outline"));
      const text = await response.text();
      return text;
    }
    if (!StenoViz.steno_outline_svg_cache) {
      const response = await fetch("steno-outline.svg");
      StenoViz.steno_outline_svg_cache = await response.text();
    }
    return StenoViz.steno_outline_svg_cache;
  }

  async steno_outline_pressed() {
    if (this.getAttribute("steno_outline_pressed")) {
      const response = await fetch(this.getAttribute("steno_outline_pressed"));
      const text = await response.text();
      return text;
    }
    if (!StenoViz.steno_outline_pressed_svg_cache) {
      const response = await fetch("steno-outline-pressed.svg");
      StenoViz.steno_outline_pressed_svg_cache = await response.text();
    }
    return StenoViz.steno_outline_pressed_svg_cache;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    await this.render();
  }

  async render() {
    // Load base SVG
    this.shadowRoot.innerHTML = await this.steno_outline();

    // Create helper with pressed SVG
    const pressedHelper = new SVGHelper(await this.steno_outline_pressed());

    // Get the matched keys
    const match = this.stroke.match(StenoViz.outline_regex);

    // Replace elements for matched keys
    if (match && match.groups) {
      // Iterate through the named groups
      Object.entries(match.groups).forEach(([key, value]) => {
        if (value) {
          // If this key is pressed
          const target = this.shadowRoot.querySelector(`#${key}`);
          const source = pressedHelper.shadowRoot.querySelector(`#${key}`);
          if (target && source) {
            target.replaceWith(source.cloneNode(true));
          }
        }
      });
    }
  }
}

customElements.define("steno-outline", StenoViz);
