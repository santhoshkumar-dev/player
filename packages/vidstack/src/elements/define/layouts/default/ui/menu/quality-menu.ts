import { html } from 'lit-html';
import { computed, signal, type ReadSignal } from 'maverick.js';
import { isFunction, unwrap } from 'maverick.js/std';

import { useDefaultLayoutContext } from '../../../../../../components/layouts/default/context';
import { i18n } from '../../../../../../components/layouts/default/translations';
import type { MenuPlacement } from '../../../../../../components/ui/menu/menu-items';
import type { TooltipPlacement } from '../../../../../../components/ui/tooltip/tooltip-content';
import { useMediaContext, useMediaState } from '../../../../../../core/api/media-context';
import { sortVideoQualities } from '../../../../../../core/quality/utils';
import { $signal } from '../../../../../lit/directives/signal';
import { IconSlot } from '../../slots';
import { $i18n } from '../utils';
import { DefaultMenuCheckbox } from './items/menu-checkbox';
import { DefaultMenuItem, DefaultMenuSection } from './items/menu-items';
import { DefaultMenuSliderItem, DefaultSliderParts, DefaultSliderSteps } from './items/menu-slider';
import { MenuPortal } from './menu-portal';

export function DefaultQualityMenu({
  placement,
  portal,
  tooltip,
}: {
  portal?: boolean;
  tooltip: TooltipPlacement | ReadSignal<TooltipPlacement>;
  placement: MenuPlacement | ReadSignal<MenuPlacement | null>;
}) {
  return $signal(() => {
    const { viewType } = useMediaState(),
      {
        translations,
        menuPortal,
        noModal,
        menuGroup,
        smallWhen: smWhen,
      } = useDefaultLayoutContext(),
      $placement = computed(() =>
        noModal() ? unwrap(placement) : !smWhen() ? unwrap(placement) : null,
      ),
      $offset = computed(() =>
        !smWhen() && menuGroup() === 'bottom' && viewType() === 'video' ? 26 : 0,
      ),
      $isOpen = signal(false);

    function onOpen() {
      $isOpen.set(true);
    }

    function onClose() {
      $isOpen.set(false);
    }

    const items = html`
      <media-menu-items
        class="vds-quality-menu-items vds-menu-items"
        placement=${$signal($placement)}
        offset=${$signal($offset)}
      >
        ${$signal(() => {
          if (!$isOpen()) {
            return null;
          }

          return DefaultQualityMenuSection();
        })}
      </media-menu-items>
    `;

    return html`
      <media-menu class="vds-quality-menu vds-menu" @open=${onOpen} @close=${onClose}>
        <media-tooltip class="vds-tooltip">
          <media-tooltip-trigger>
            <media-menu-button
              class="vds-menu-button vds-button"
              aria-label=${$i18n(translations, 'Quality')}
            >
              ${IconSlot('menu-settings', 'vds-rotate-icon')}
            </media-menu-button>
          </media-tooltip-trigger>
          <media-tooltip-content
            class="vds-tooltip-content"
            placement=${isFunction(tooltip) ? $signal(tooltip) : tooltip}
          >
            ${$i18n(translations, 'Quality')}
          </media-tooltip-content>
        </media-tooltip>
        ${portal ? MenuPortal(menuPortal, items) : items}
      </media-menu>
    `;
  });
}

function DefaultAutoQualityCheckbox() {
  const { remote, qualities } = useMediaContext(),
    { autoQuality, canSetQuality, qualities: $qualities } = useMediaState(),
    { translations } = useDefaultLayoutContext(),
    label = 'Auto',
    $disabled = computed(() => !canSetQuality() || $qualities().length <= 1);

  if ($disabled()) return null;

  return DefaultMenuItem({
    label: $i18n(translations, label),
    children: DefaultMenuCheckbox({
      label,
      checked: autoQuality,
      onChange(checked, trigger) {
        if (checked) {
          remote.requestAutoQuality(trigger);
        } else {
          remote.changeQuality(qualities.selectedIndex, trigger);
        }
      },
    }),
  });
}

function DefaultQualityMenuSection() {
  return $signal(() => {
    const { hideQualityBitrate, translations } = useDefaultLayoutContext(),
      { canSetQuality, qualities, quality } = useMediaState(),
      $disabled = computed(() => !canSetQuality() || qualities().length <= 1),
      $sortedQualities = computed(() => sortVideoQualities(qualities()));

    if ($disabled()) return null;

    return DefaultMenuSection({
      label: $i18n(translations, 'Quality'),
      value: $signal(() => {
        const height = quality()?.height,
          bitrate = !hideQualityBitrate() ? quality()?.bitrate : null,
          bitrateText = bitrate && bitrate > 0 ? `${(bitrate / 1000000).toFixed(2)} Mbps` : null,
          autoText = i18n(translations, 'Auto');
        return height ? `${height}p${bitrateText ? ` (${bitrateText})` : ''}` : autoText;
      }),
      children: [
        DefaultMenuSliderItem({
          upIcon: 'menu-quality-up',
          downIcon: 'menu-quality-down',
          children: DefaultQualitySlider(),
          isMin: () => $sortedQualities()[0] === quality(),
          isMax: () => $sortedQualities().at(-1) === quality(),
        }),
        DefaultAutoQualityCheckbox(),
      ],
    });
  });
}

function DefaultQualitySlider() {
  const { translations } = useDefaultLayoutContext(),
    $label = $i18n(translations, 'Quality');
  return html`
    <media-quality-slider class="vds-quality-slider vds-slider" aria-label=${$label}>
      ${DefaultSliderParts()}${DefaultSliderSteps()}
    </media-quality-slider>
  `;
}
