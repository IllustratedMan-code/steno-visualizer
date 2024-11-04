function getThemeColors() {
  const rootStyle = getComputedStyle(document.documentElement);

  // Fetch specific color variables used by mdBook
  const backgroundColor = rootStyle.getPropertyValue("--fg").trim();
  const textColor = rootStyle.getPropertyValue("--fg").trim();

  return { backgroundColor, textColor };
}

class SVGHelper {
  constructor(svg) {
    // Just create a document fragment to parse the SVG
    const parser = new DOMParser();
    const doc = parser.parseFromString(svg, "text/html");
    this.shadowRoot = doc;
    this.shadowRoot.querySelectorAll(".pressed > path").forEach((element) => {
      element.style.stroke = getThemeColors().textColor;
    });
    this.shadowRoot
      .querySelectorAll(".notpressed > path ")
      .forEach((element) => {
        element.style.stroke = getThemeColors().textColor;
        element.style.fill = getThemeColors().textColor;
      });
  }
  get string() {
    const serializer = new XMLSerializer();
    return serializer.serializeToString(this.shadowRoot);
  }
}

class StenoViz extends HTMLElement {
  static outline_regex =
    /^(?<num>#)?(?:(?<ls>S)?(?<lt>T)?(?<lk>K)?(?<lp>P)?(?<lw>W)?(?<lh>H)?(?<lr>R)?)?(?:(?<la>A)?(?<lo>O)?)?(?<star>\*)?(?:(?<re>E)?(?<ru>U)?(?:-)?)?(?:(?<rf>F)?(?<rr>R)?(?<rp>P)?(?<rb>B)?(?<rl>L)?(?<rg>G)?(?<rt>T)?(?<rs>S)?(?<rd>D)?(?<rz>Z)?)?$/;
  static steno_outline_svg_cache = null;

  static observedAttributes = ["stroke", "steno_outline", "opacity"];

  get stroke() {
    return this.getAttribute("stroke");
  }

  get opacity() {
    return this.getAttribute("opacity") || "0.0";
  }

  async steno_outline() {
    if (this.getAttribute("steno_outline")) {
      const response = await fetch(this.getAttribute("steno_outline"));
      const text = await response.text();
      return text;
    }
    if (!StenoViz.steno_outline_svg_cache) {
      const response = await fetch("img/steno-outline.svg");
      StenoViz.steno_outline_svg_cache = await response.text();
    }
    return StenoViz.steno_outline_svg_cache;
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          this.connectedCallback();
        }
      });
    });
  }

  async connectedCallback() {
    console.log(getThemeColors());
    this.shadowRoot.innerHTML = await this.render(this.stroke);
  }

  async attributeChangedCallback(name, oldValue, newValue) {
    await this.connectedCallback();
  }

  async render(stroke) {
    // Load base SVG
    const svg = new SVGHelper(await this.steno_outline());
    // Create helper with pressed SVG

    // Get the matched keys
    const match = stroke.match(StenoViz.outline_regex);

    // Replace elements for matched keys
    if (match && match.groups) {
      // Iterate through the named groups
      Object.entries(match.groups).forEach(([key, value]) => {
        if (!value) {
          // If this key is pressed
          const target = svg.shadowRoot.querySelector(`#${key}`);
          target.setAttribute("opacity", this.opacity);
        }
      });
    }
    return svg.string;
  }
}

customElements.define("steno-outline", StenoViz);
