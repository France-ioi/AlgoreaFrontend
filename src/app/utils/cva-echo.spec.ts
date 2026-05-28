import { createCvaEcho } from './cva-echo';

describe('createCvaEcho', () => {
  it('skips onChange when the outbound value equals the last stored value', () => {
    const echo = createCvaEcho((a: string, b: string) => a === b);
    const onChange = jasmine.createSpy<(value: string) => void>('onChange');
    echo.rememberInbound('a');
    echo.emitIfChanged('a', onChange);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange and stores clones when cloneOnStore is provided', () => {
    interface Value { x: number }
    const echo = createCvaEcho<Value>(
      (a, b) => a.x === b.x,
      v => ({ x: v.x }),
    );
    const onChange = jasmine.createSpy<(value: Value) => void>('onChange');
    echo.emitIfChanged({ x: 1 }, onChange);
    expect(onChange).toHaveBeenCalledWith({ x: 1 });
    onChange.calls.reset();
    echo.emitIfChanged({ x: 1 }, onChange);
    expect(onChange).not.toHaveBeenCalled();
  });
});
