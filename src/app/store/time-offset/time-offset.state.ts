
export interface State {
  latestOffsets: number[], // a buffer of the latest offset values to determine current offset
}

export const initialState: State = {
  latestOffsets: [],
};
