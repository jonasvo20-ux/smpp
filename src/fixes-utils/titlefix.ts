function vak_prefix(page: string): string | undefined {
  switch (page) {
    case "news":
      return "Vaknieuws";

    case "course":
      return "Online les";

    case "documents":
      return "Documenten";

    case "uploadzone":
      return "Uploadzone";

    case "exercises":
      return "Oefeningen";

    case "lpaths":
      return "Leerpaden";

    case "weblinks":
      return "Weblinks";

    case "tasks":
      return "Taken";

    case "cooperate":
      return "Samenwerken";

    case "classmates":
      return "Studiegenoten";

    case "forum":
      return "Forum";

    case "survey":
      return "Enquêtes";

    case "wiki":
      return "Wiki";

    default:
      return undefined;
  }
}

function title_prefix(): string | undefined {
  const host = location.host.split(".")[0];
  if (!host) return;
  const subdomain = host.charAt(0).toUpperCase() + host.slice(1);
  const url = location.pathname;
  const qstr = new URLSearchParams(location.search);
  const module = qstr.get("module");
  const pathSegment = url.split("/")[1];
  if (!pathSegment) return;
  let page = pathSegment.toLowerCase();
  if (module !== null) {
    page = module.toLowerCase();
  }

  switch (page) {
    case "planner":
      return "Planner";
    case "photos":
      return "Photos";
    case "agenda":
      return "Agenda";
    case "results":
      return "Resultaten";
    case "messages":
      return "Berichten";
    case "mydoc":
      return "Mijn documenten";
    case "forms":
      return "Formulieren";
    case "studentcard":
      return "Mijn leerlingfiche";
    case "manual":
      return "Handleiding";
    case "timetable":
      return "Lesrooster";
    case "intradesk":
      return "Intradesk";
    case "online-session":
      return "Online sessies";
    case "lvs":
      return "Leerlingvolgsysteem";
    case "":
      return "Start - " + subdomain;
    default:
      break;
  }

  const topnav_title = document.querySelector<HTMLElement>(
    ".topnav__title"
  )?.innerText;
  const prefix = vak_prefix(page);
  if (prefix !== undefined) {
    if (topnav_title) {
      return prefix + " - " + topnav_title;
    } else {
      return prefix;
    }
  }
  return undefined;
}

export function titleFix(): void {
  const prepend = title_prefix();
  if (prepend !== undefined) {
    const title = document.querySelector<HTMLElement>("head > title");
    if (title) {
      title.innerText = prepend + " - Smartschool";
    }
  }
}
