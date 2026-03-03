export interface AnswerBackLink {
  url: string,
  label: string,
}

export interface State {
  backLink: AnswerBackLink | null,
}

export const initialState: State = {
  backLink: null,
};
