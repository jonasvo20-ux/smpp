function scrape_from_html(query: string, func: (el: Element, data: any[]) => void): any[] {
  const data: any[] = [];
  let scrape_els = document.querySelectorAll(query);
  if (scrape_els.length === 0) {
    return data;
  }
  for (let i = 0; i < scrape_els.length; i++) {
    func(scrape_els[i]!, data);
  }

  return data;
}

function is_valid_data(data: any): boolean {
  return !(data === undefined || data.length === 0 || data.length === undefined);
}

function scrape_data_if_needed(data: any, query: string, func: (el: Element, data: any[]) => void, done_func: (data: any[]) => void, name: string): boolean {
  if (is_valid_data(data)) {
    done_func(data);
    window.localStorage.setItem(name, JSON.stringify(data));
    return true;
  }

  data = scrape_from_html(query, func);
  if (is_valid_data(data)) {
    done_func(data);
    window.localStorage.setItem(name, JSON.stringify(data));
    return true;
  }

  return false;
}

function scrape(name: string, query: string, func: (el: Element, data: any[]) => void, done_func: (data: any[]) => void, interval_time: number = 0): void {
  const raw = window.localStorage.getItem(name);
  let data: any = raw !== null ? JSON.parse(raw) : null;
  if (scrape_data_if_needed(data, query, func, done_func, name)) {
    return;
  }
  if (interval_time === 0) {
    return;
  }

  let interval = setInterval(() => {
    if (scrape_data_if_needed(data, query, func, done_func, name)) {
      clearInterval(interval);
    }
  }, interval_time);
}
