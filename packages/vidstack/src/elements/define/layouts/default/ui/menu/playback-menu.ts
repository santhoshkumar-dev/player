import { html } from 'lit-html';
import { isArray } from 'maverick.js/std';

import { useDefaultLayoutContext } from '../../../../../../components/layouts/default/context';
import { i18n } from '../../../../../../components/layouts/default/translations';
import { useMediaContext, useMediaState } from '../../../../../../core/api/media-context';
import { $signal } from '../../../../../lit/directives/signal';
import { $i18n } from '../utils';
import { DefaultMenuCheckbox } from './items/menu-checkbox';
import { DefaultMenuItem, DefaultMenuSection } from './items/menu-items';
import { DefaultMenuSliderItem, DefaultSliderParts, DefaultSliderSteps } from './items/menu-slider';

export function DefaultPlaybackMenu() {
  return $signal(() => {
    const { translations } = useDefaultLayoutContext();
    return html`
      <media-menu class="vds-playback-menu vds-menu">
        ${DefaultMenuButton({
          label: () => i18n(translations, 'Playback'),
          icon: 'menu-playback',
        })}
        <media-menu-items class="vds-menu-items">
          ${[
            DefaultMenuSection({
              children: DefaultLoopCheckbox(),
            }),
            DefaultSpeedMenuSection(),
          ]}
        </media-menu-items>
      </media-menu>
    `;
  });
}

function DefaultLoopCheckbox() {
  const { remote } = useMediaContext(),
    { translations } = useDefaultLayoutContext(),
    label = 'Loop';

  return DefaultMenuItem({
    label: $i18n(translations, label),
    children: DefaultMenuCheckbox({
      label,
      storageKey: 'vds-player::user-loop',
      onChange(checked, trigger) {
        remote.userPrefersLoopChange(checked, trigger);
      },
    }),
  });
}

function DefaultSpeedMenuSection() {
  return $signal(() => {
    const { translations } = useDefaultLayoutContext(),
      { canSetPlaybackRate, playbackRate } = useMediaState();

    if (!canSetPlaybackRate()) return null;

    return DefaultMenuSection({
      label: $i18n(translations, 'Speed'),
      value: $signal(() =>
        playbackRate() === 1 ? i18n(translations, 'Normal') : playbackRate() + 'x',
      ),
      children: [
        DefaultMenuSliderItem({
          upIcon: 'menu-speed-up',
          downIcon: 'menu-speed-down',
          children: DefaultSpeedSlider(),
          isMin: () => playbackRate() === getSpeedMin(),
          isMax: () => playbackRate() === getSpeedMax(),
        }),
      ],
    });
  });
}

function getSpeedMin() {
  const { playbackRates } = useDefaultLayoutContext(),
    rates = playbackRates();
  return isArray(rates) ? rates[0] ?? 0 : rates.min;
}

function getSpeedMax() {
  const { playbackRates } = useDefaultLayoutContext(),
    rates = playbackRates();
  return isArray(rates) ? rates[rates.length - 1] ?? 2 : rates.max;
}

function getSpeedStep() {
  const { playbackRates } = useDefaultLayoutContext(),
    rates = playbackRates();
  return isArray(rates) ? rates[1] - rates[0] || 0.25 : rates.step;
}

function DefaultSpeedSlider() {
  const { translations } = useDefaultLayoutContext(),
    $label = $i18n(translations, 'Speed'),
    $min = getSpeedMin,
    $max = getSpeedMax,
    $step = getSpeedStep;

  return html`
    <media-speed-slider
      class="vds-speed-slider vds-slider"
      aria-label=${$label}
      min=${$signal($min)}
      max=${$signal($max)}
      step=${$signal($step)}
      key-step=${$signal($step)}
    >
      ${DefaultSliderParts()}${DefaultSliderSteps()}
    </media-speed-slider>
  `;
}

function DefaultMenuButton({ label, icon }: { label: any; icon: string }) {
  return html`
    <media-menu-button class="vds-menu-button" aria-label=${$signal(label)}>
      <span class="vds-menu-button-label">${$signal(label)}</span>
      <span class="vds-menu-button-hint" data-part="hint"></span>
      <media-icon class="vds-icon" type=${icon}></media-icon>
    </media-menu-button>
  `;
}
