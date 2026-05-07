export interface BackLink {
  url: string,
  label: string,
}

export interface State {
  backLink: BackLink | null,
}

export const initialState: State = {
  backLink: null,
};
