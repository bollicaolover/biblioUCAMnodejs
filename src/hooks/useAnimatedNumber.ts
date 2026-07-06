import { useEffect, useRef, useState } from 'react';

export function useAnimatedNumber(target: number, duration = 300) {
    const [value, setValue] = useState(target);
    const prevTarget = useRef(target);

    useEffect(() => {
        const from = prevTarget.current;
        const to = target;
        if (from === to) return;

        const start = performance.now();
        let frameId = 0;

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - (1 - progress) ** 3;
            setValue(Math.round(from + (to - from) * eased));
            if (progress < 1) {
                frameId = requestAnimationFrame(tick);
            } else {
                prevTarget.current = to;
            }
        };

        frameId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(frameId);
    }, [target, duration]);

    return value;
}
