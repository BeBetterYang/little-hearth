export interface Order {
  id?: string;
  dateKey?: string;
  date: string;
  items: string;
  note: string;
  status: string;
  images: string[];
  extra: number;
  dishIds?: string[];
}

export interface Dish {
  id: string;
  name: string;
  tags: string[];
  img: string;
  ready: boolean;
  desc?: string;
}

export interface HomeSettings {
  greeting: string;
  titlePrefix: string;
  titleHighlight: string;
  titleSuffix: string;
  heroImage: string;
}
