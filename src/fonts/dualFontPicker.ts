type FontDef = { name: string; weights?: number[]; ital?: boolean; preview?: string };
type PairingDef = { heading: string; body: string; notes?: string; preview?: string };
type FontsPayload = {
    available: FontDef[];
    defaults?: { heading?: string; body?: string };
    pairings?: PairingDef[];
};

const DEFAULT_PREVIEW = "Welcome to Fletch Photobooth";

function buildGoogleFontsURL(fonts: FontDef[]) {
    const fams = fonts.map(f => {
        const fam = encodeURIComponent(f.name).replace(/%20/g, "+");
        const ws = (f.weights?.length ? Array.from(new Set(f.weights)) : [400]).sort((a, b) => a - b);
        if (f.ital) {
            const pairs = [...ws.map(w => `0,${w}`), ...ws.map(w => `1,${w}`)].join(";");
            return `family=${fam}:ital,wght@${pairs}`;
        }
        return `family=${fam}:wght@${ws.join(";")}`;
    }).join("&");
    return `https://fonts.googleapis.com/css2?${fams}&display=swap`;
}

function injectStylesheetOnce(href: string) {
    if ([...document.querySelectorAll('link[rel="stylesheet"]')].some(l => (l as HTMLLinkElement).href === href)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
}

function setHeadingFont(family: string) {
    document.documentElement.style.setProperty("--font-heading", `'${family}', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`);
    localStorage.setItem("font.heading", family);
}
function setBodyFont(family: string) {
    document.documentElement.style.setProperty("--font-body", `'${family}', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`);
    localStorage.setItem("font.body", family);
}

function findFontPreview(fonts: FontDef[], name: string): string {
    const f = fonts.find(x => x.name === name);
    return f?.preview || DEFAULT_PREVIEW;
}
function findPairingPreview(pairing?: PairingDef, fonts?: FontDef[]): string {
    if (pairing?.preview) return pairing.preview;
    if (pairing && fonts) return findFontPreview(fonts, pairing.heading);
    return DEFAULT_PREVIEW;
}

function renderQuickPicks(args: {
    container: HTMLElement;
    pairings: PairingDef[];
    fonts: FontDef[];
    apply: (heading: string, body: string, previewText?: string) => void;
}) {
    const { container, pairings, fonts, apply } = args;
    container.innerHTML = "";

    // Seasonal first
    const seasonalWords = ["Christmas", "Holiday", "Spooky", "Valentine", "Easter", "New Year"];
    const sorted = [...pairings].sort((a, b) => {
        const aSeason = a.preview && seasonalWords.some(w => a.preview!.includes(w));
        const bSeason = b.preview && seasonalWords.some(w => b.preview!.includes(w));
        return (aSeason === bSeason) ? 0 : (aSeason ? -1 : 1);
    });

    for (const p of sorted) {
        const headingPreview = p.preview
            || fonts.find(f => f.name === p.heading)?.preview
            || DEFAULT_PREVIEW;

        const card = document.createElement("button");
        card.type = "button";
        card.className = "group w-full text-left rounded-xl border p-3 hover:shadow focus:outline-none focus:ring transition";
        card.innerHTML = `
      <div class="text-xs opacity-70 mb-1">Quick Pick</div>
      <div class="text-sm"><span class="font-semibold">${p.heading}</span> + ${p.body}</div>
      <div class="mt-1 text-base truncate" style="font-family: '${p.heading}', system-ui, sans-serif;">
        ${headingPreview}
      </div>
      ${p.notes ? `<div class="mt-1 text-xs opacity-70">${p.notes}</div>` : ""}
    `;
        card.addEventListener("click", () => apply(p.heading, p.body, headingPreview));
        container.appendChild(card);
    }
}

export async function setupDualFontPicker(opts: {
    headingSelect: HTMLSelectElement;
    bodySelect: HTMLSelectElement;
    pairingSelect?: HTMLSelectElement;
    headingPreview?: HTMLElement;
    bodyPreview?: HTMLElement;
    fontsEndpoint?: string;
}) {
    const endpoint = opts.fontsEndpoint ?? "/api/fonts";
    const res = await fetch(endpoint, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch fonts: ${res.status}`);
    const data = (await res.json()) as FontsPayload;

    const fonts = data.available ?? [];
    const pairings = data.pairings ?? [];
    if (!fonts.length) return;

    injectStylesheetOnce(buildGoogleFontsURL(fonts));

    // Populate selects
    const populate = (sel: HTMLSelectElement) => {
        sel.innerHTML = "";
        fonts.forEach(f => {
            const opt = document.createElement("option");
            opt.value = f.name;
            opt.textContent = f.name;
            opt.style.fontFamily = `'${f.name}', system-ui, sans-serif`;
            sel.appendChild(opt);
        });
    };
    populate(opts.headingSelect);
    populate(opts.bodySelect);

    // Defaults
    const savedHeading = localStorage.getItem("font.heading");
    const savedBody = localStorage.getItem("font.body");
    const defHeading = savedHeading || data.defaults?.heading || fonts[0].name;
    const defBody = savedBody || data.defaults?.body || fonts[0].name;

    setHeadingFont(defHeading);
    setBodyFont(defBody);
    opts.headingSelect.value = defHeading;
    opts.bodySelect.value = defBody;

    if (opts.headingPreview) {
        opts.headingPreview.style.fontFamily = `'${defHeading}', system-ui, sans-serif`;
        opts.headingPreview.textContent = findFontPreview(fonts, defHeading);
    }
    if (opts.bodyPreview) {
        opts.bodyPreview.style.fontFamily = `'${defBody}', system-ui, sans-serif`;
        opts.bodyPreview.textContent = findFontPreview(fonts, defBody);
    }

    // Individual change handlers
    opts.headingSelect.addEventListener("change", () => {
        const val = opts.headingSelect.value;
        setHeadingFont(val);
        if (opts.headingPreview) {
            opts.headingPreview.style.fontFamily = `'${val}', system-ui, sans-serif`;
            opts.headingPreview.textContent = findFontPreview(fonts, val);
        }
        if (opts.pairingSelect) opts.pairingSelect.value = "";
    });
    opts.bodySelect.addEventListener("change", () => {
        const val = opts.bodySelect.value;
        setBodyFont(val);
        if (opts.bodyPreview) {
            opts.bodyPreview.style.fontFamily = `'${val}', system-ui, sans-serif`;
            opts.bodyPreview.textContent = findFontPreview(fonts, val);
        }
        if (opts.pairingSelect) opts.pairingSelect.value = "";
    });

    // Pairings <select>
    if (opts.pairingSelect && pairings.length) {
        const sel = opts.pairingSelect;
        sel.innerHTML = "";
        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "— Choose a pairing —";
        sel.appendChild(placeholder);

        for (const p of pairings) {
            const opt = document.createElement("option");
            opt.value = `${p.heading}|${p.body}`;
            opt.textContent = p.notes ? `${p.heading} + ${p.body} — ${p.notes}` : `${p.heading} + ${p.body}`;
            sel.appendChild(opt);
        }

        sel.addEventListener("change", () => {
            if (!sel.value) return;
            const [h, b] = sel.value.split("|");
            const pairing = pairings.find(p => p.heading === h && p.body === b);

            // apply fonts
            opts.headingSelect.value = h;
            opts.bodySelect.value = b;
            setHeadingFont(h);
            setBodyFont(b);

            // pairing-aware previews
            const headingPreviewText = findPairingPreview(pairing, fonts);
            const bodyPreviewText = findFontPreview(fonts, b);

            if (opts.headingPreview) {
                opts.headingPreview.style.fontFamily = `'${h}', system-ui, sans-serif`;
                opts.headingPreview.textContent = headingPreviewText;
            }
            if (opts.bodyPreview) {
                opts.bodyPreview.style.fontFamily = `'${b}', system-ui, sans-serif`;
                opts.bodyPreview.textContent = bodyPreviewText;
            }
        });
    }

    // Quick Picks grid
    const qpEl = document.getElementById("quickPicks") as HTMLElement | null;
    const qpToggle = document.getElementById("qpToggle") as HTMLButtonElement | null;

    const applyBoth = (h: string, b: string, previewText?: string) => {
        opts.headingSelect.value = h;
        opts.bodySelect.value = b;
        setHeadingFont(h);
        setBodyFont(b);

        const bodyPreview = findFontPreview(fonts, b);
        if (opts.headingPreview) {
            opts.headingPreview.style.fontFamily = `'${h}', system-ui, sans-serif`;
            opts.headingPreview.textContent = previewText || findFontPreview(fonts, h);
        }
        if (opts.bodyPreview) {
            opts.bodyPreview.style.fontFamily = `'${b}', system-ui, sans-serif`;
            opts.bodyPreview.textContent = bodyPreview;
        }
        if (opts.pairingSelect) opts.pairingSelect.value = "";
    };

    if (qpEl && pairings.length) {
        renderQuickPicks({
            container: qpEl,
            pairings,
            fonts,
            apply: applyBoth
        });

        let expanded = false;
        const updateGrid = () => {
            qpEl.style.maxHeight = expanded ? "" : "220px";
            qpEl.style.overflow = expanded ? "visible" : "hidden";
            if (qpToggle) qpToggle.textContent = expanded ? "show less" : "show all";
        };
        updateGrid();
        qpToggle?.addEventListener("click", () => {
            expanded = !expanded;
            updateGrid();
        });
    }
}