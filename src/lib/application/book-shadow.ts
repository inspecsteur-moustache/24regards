import type { FlipProgressSource, PageNavigator } from '../domain/ports';
export function observeBookShadow(
  navigation: PageNavigator,
  progress: FlipProgressSource,
  cast: (left: number, right: number) => void,
): () => void {
  const resting = (page: number) => ({
    left: page === 0 ? 0 : 1,
    right: page === navigation.snapshot().pageCount - 1 ? 0 : 1,
  });
  const swing = (from: number, to: number, value: number) =>
    from === to ? from : Math.max(0, Math.cos(Math.PI * (from === 1 ? value : 1 - value)));
  const stopPage = navigation.subscribe((snapshot) => {
    const halves =
      snapshot.orientation === 'single' ? { left: 1, right: 1 } : resting(snapshot.pageIndex);
    cast(halves.left, halves.right);
  });
  const stopProgress = progress.subscribeProgress((event) => {
    if (navigation.snapshot().orientation === 'single') return cast(1, 1);
    const from = resting(event.from);
    const to = resting(event.to);
    cast(swing(from.left, to.left, event.progress), swing(from.right, to.right, event.progress));
  });
  return () => {
    stopPage();
    stopProgress();
  };
}
