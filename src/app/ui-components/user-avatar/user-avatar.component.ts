import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { generateAvatar, AVATAR_SIZE } from './avatar';
import { AvatarCacheService } from './avatar-cache.service';

// Rendered pixel size when no `size` input is provided. Independent of `AVATAR_SIZE` (the SVG's
// internal coordinate system / viewBox) - the SVG scales to fit whichever pixel size is requested.
const DEFAULT_SIZE = 32;

@Component({
  selector: 'alg-user-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      [attr.viewBox]="viewBox"
      fill="none"
      role="img"
      [attr.aria-label]="ariaLabel()"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect [attr.width]="boxSize" [attr.height]="boxSize" [attr.fill]="data().backgroundColor" />
      <rect
        [attr.width]="boxSize"
        [attr.height]="boxSize"
        [attr.transform]="wrapperTransform()"
        [attr.fill]="data().wrapperColor"
        [attr.rx]="data().isCircle ? boxSize : boxSize / 6"
      />
      <g [attr.transform]="faceTransform()">
        @if (data().isMouthOpen) {
          <path
            [attr.d]="'M15 ' + (19 + data().mouthSpread) + 'c2 1 4 1 6 0'"
            [attr.stroke]="data().faceColor"
            fill="none"
            stroke-linecap="round"
          />
        } @else {
          <path
            [attr.d]="'M13,' + (19 + data().mouthSpread) + ' a1,0.75 0 0,0 10,0'"
            [attr.fill]="data().faceColor"
          />
        }
        <rect
          [attr.x]="14 - data().eyeSpread"
          y="14"
          width="1.5"
          height="2"
          rx="1"
          stroke="none"
          [attr.fill]="data().faceColor"
        />
        <rect
          [attr.x]="20 + data().eyeSpread"
          y="14"
          width="1.5"
          height="2"
          rx="1"
          stroke="none"
          [attr.fill]="data().faceColor"
        />
      </g>
    </svg>
  `,
  styles: `
    :host {
      display: inline-flex;
      line-height: 0;
    }

    svg {
      display: block;
      border-radius: 50%;
      /* Required for the wrapper rect to be visually clipped to the circle */
      overflow: hidden;
    }
  `,
})
export class UserAvatarComponent {
  // `$localize` is typed as `any` in Angular's d.ts, hence the explicit cast to keep strict typing happy.
  private static readonly defaultAriaLabel = $localize`User avatar` as string;

  seed = input.required<string>();
  size = input<number>(DEFAULT_SIZE);
  ariaLabel = input<string>(UserAvatarComponent.defaultAriaLabel);

  // The cache is required: any feature using this component must provide `AvatarCacheService` so
  // we never silently leak through an unbounded cache.
  private readonly avatarCache = inject(AvatarCacheService);

  protected readonly boxSize = AVATAR_SIZE;
  protected readonly viewBox = `0 0 ${AVATAR_SIZE} ${AVATAR_SIZE}`;

  protected data = computed(() => {
    const seed = this.seed();
    const cached = this.avatarCache.get(seed);
    if (cached) return cached;
    const avatar = generateAvatar(seed);
    this.avatarCache.set(seed, avatar);
    return avatar;
  });

  protected wrapperTransform = computed(() => {
    const d = this.data();
    const center = AVATAR_SIZE / 2;
    return `translate(${d.wrapperTranslateX} ${d.wrapperTranslateY}) ` +
      `rotate(${d.wrapperRotate} ${center} ${center}) ` +
      `scale(${d.wrapperScale})`;
  });

  protected faceTransform = computed(() => {
    const d = this.data();
    const center = AVATAR_SIZE / 2;
    return `translate(${d.faceTranslateX} ${d.faceTranslateY}) ` +
      `rotate(${d.faceRotate} ${center} ${center})`;
  });
}
