import { WidgetBase, registerWidget } from "./widgets.js";
import { getSchoolName } from "../fixes-utils/utils.js";
import { DEBUG, sendDebug } from "../common/utils.js";

interface EvaluationCourse {
  name?: string;
}

interface Evaluation {
  graphic?: { value?: number | string } | null;
  courses?: EvaluationCourse[];
}

interface VakTotaal {
  name: string;
  total: number;
  count: number;
}

const VOLDOENDE_GRENS = 50;
const GOED_GRENS = 75;
const GOED_BEZIG_GRENS = 65;
const UITSTEKEND_GRENS = 80;

class PuntenWidget extends WidgetBase {
  override get category() {
    return "other";
  }

  override get name() {
    return "PuntenWidget";
  }

  async fetchEvaluaties(): Promise<Evaluation[]> {
    const schoolName = getSchoolName();
    if (!schoolName) {
      throw new Error("Schoolnaam kon niet bepaald worden.");
    }
    const url = `https://${schoolName}.smartschool.be/results/api/v1/evaluations/?itemsOnPage=1000`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    if (DEBUG) sendDebug("[PT]", "Evaluations fetched:", data);
    return Array.isArray(data) ? data : [];
  }

  berekenGemiddeldes(evaluaties: Evaluation[]) {
    const perVak = new Map<string, VakTotaal>();
    let totaal = 0;
    let aantal = 0;

    for (const evaluatie of evaluaties) {
      const raw = evaluatie?.graphic?.value;
      const waarde = typeof raw === "string" ? parseFloat(raw) : raw;
      if (typeof waarde !== "number" || Number.isNaN(waarde)) continue;

      const vakNaam = evaluatie.courses?.[0]?.name || "Onbekend vak";
      const vak = perVak.get(vakNaam) || { name: vakNaam, total: 0, count: 0 };
      vak.total += waarde;
      vak.count += 1;
      perVak.set(vakNaam, vak);

      totaal += waarde;
      aantal += 1;
    }

    const vakken = Array.from(perVak.values())
      .map((vak) => ({ name: vak.name, average: vak.total / vak.count }))
      .sort((a, b) => a.average - b.average);

    const overallAverage = aantal > 0 ? totaal / aantal : null;

    return { vakken, overallAverage };
  }

  kleurVoorWaarde(waarde: number): string {
    if (waarde >= UITSTEKEND_GRENS) return "var(--color-green)";
    if (waarde >= GOED_BEZIG_GRENS) return "var(--color-accent)";
    if (waarde >= VOLDOENDE_GRENS) return "var(--color-orange)";
    return "var(--color-red)";
  }

  boodschapVoorGemiddelde(waarde: number): string {
    if (waarde >= UITSTEKEND_GRENS) return "Uitstekend bezig! 🎉";
    if (waarde >= GOED_BEZIG_GRENS) return "Goed bezig, blijf zo verdergaan!";
    if (waarde >= VOLDOENDE_GRENS) return "Het kan beter, blijf oefenen.";
    return "Let op, dit moet dringend beter.";
  }

  override async createContent() {
    const container = document.createElement("div");
    container.classList.add("punten-widget");

    const title = document.createElement("h2");
    title.classList.add("punten-title");
    title.innerText = "Mijn Punten";
    container.appendChild(title);

    const body = document.createElement("div");
    body.classList.add("punten-body");
    body.innerText = "Bezig met laden...";
    container.appendChild(body);

    this.fetchEvaluaties()
      .then((evaluaties) => {
        const { vakken, overallAverage } = this.berekenGemiddeldes(evaluaties);
        body.innerHTML = "";

        if (overallAverage === null) {
          const geen = document.createElement("div");
          geen.classList.add("punten-geen-data");
          geen.innerText = "Nog geen resultaten gevonden.";
          body.appendChild(geen);
          return;
        }

        const overallDiv = document.createElement("div");
        overallDiv.classList.add("punten-overall");

        const overallValue = document.createElement("div");
        overallValue.classList.add("punten-overall-value");
        overallValue.innerText = `${overallAverage.toFixed(1)}%`;
        overallValue.style.color = this.kleurVoorWaarde(overallAverage);
        overallDiv.appendChild(overallValue);

        const overallMessage = document.createElement("div");
        overallMessage.classList.add("punten-overall-message");
        overallMessage.innerText = this.boodschapVoorGemiddelde(overallAverage);
        overallDiv.appendChild(overallMessage);

        body.appendChild(overallDiv);

        const verbeterVakken = vakken.filter((v) => v.average < GOED_BEZIG_GRENS);
        if (verbeterVakken.length > 0) {
          const verbeterMessage = document.createElement("div");
          verbeterMessage.classList.add("punten-verbeter-message");
          verbeterMessage.innerText =
            verbeterVakken.length === 1
              ? "1 vak heeft verbetering nodig:"
              : `${verbeterVakken.length} vakken hebben verbetering nodig:`;
          body.appendChild(verbeterMessage);
        }

        const list = document.createElement("div");
        list.classList.add("punten-vakken-list");

        vakken.forEach((vak) => {
          const row = document.createElement("div");
          row.classList.add("punten-vak-row");

          const naam = document.createElement("span");
          naam.classList.add("punten-vak-name");
          naam.innerText = vak.name;
          naam.title = vak.name;

          const barContainer = document.createElement("div");
          barContainer.classList.add("punten-vak-bar-container");

          const bar = document.createElement("div");
          bar.classList.add("punten-vak-bar");
          const clampedWidth = Math.max(0, Math.min(100, vak.average));
          bar.style.width = `${clampedWidth}%`;
          const barKleur =
            vak.average >= GOED_GRENS ? "#5cc951" : vak.average >= VOLDOENDE_GRENS ? "#ffd353" : "#e14448";
          bar.style.setProperty("background-color", barKleur, "important");
          barContainer.appendChild(bar);

          const waarde = document.createElement("span");
          waarde.classList.add("punten-vak-value");
          waarde.innerText = `${vak.average.toFixed(1)}%`;
          waarde.style.color = this.kleurVoorWaarde(vak.average);

          row.append(naam, barContainer, waarde);
          list.appendChild(row);
        });

        body.appendChild(list);
      })
      .catch((error) => {
        console.error("SMPP: Kon punten niet ophalen:", error);
        body.innerHTML = "";
        const fout = document.createElement("div");
        fout.classList.add("punten-geen-data");
        fout.innerText = "Kon je punten niet ophalen.";
        body.appendChild(fout);
      });

    return container;
  }

  override async createPreview() {
    const previewContainer = document.createElement("div");
    previewContainer.classList.add("punten-widget-preview");

    const title = document.createElement("div");
    title.classList.add("punten-preview-title");
    title.innerText = "Punten";
    previewContainer.appendChild(title);

    const subtitle = document.createElement("div");
    subtitle.classList.add("punten-preview-subtitle");
    subtitle.innerText = "Gemiddeldes & voortgang";
    previewContainer.appendChild(subtitle);

    return previewContainer;
  }
}

registerWidget(new PuntenWidget());
