const BASE_URL = import.meta.env.BASE_URL;
const assetPath = (path) => `${BASE_URL}${path}`.replace(/\/+/g, '/');


export const ICONS = {
  github: {
    src: assetPath('assets/icons/github.svg'),
    alt: 'GitHub',
    title: 'View on GitHub',
  },
  twitter: {
    src: assetPath('assets/icons/twitter.svg'),
    alt: 'Twitter',
    title: 'Follow on Twitter',
  },
  instagram: {
    src: assetPath('assets/icons/instagram.svg'),
    alt: 'Instagram',
    title: 'Follow on Instagram',
  },
  menu: {
    src: assetPath('assets/icons/menu.svg'),
    alt: 'Menu',
    title: 'Open menu',
    className: 'icon-menu'
  },
  close: {
    src: assetPath('assets/icons/close.svg'),
    alt: 'Close',
    title: 'Close menu',
    className: 'icon-close'
  },
  arrowUp: {
    src: assetPath('assets/icons/arrow-up.png'),
    alt: 'Arrow Up',
    title: 'Scroll to top',
    className: 'icon-arrow-up'
  },
  leftArrow: {
    src: assetPath('assets/icons/left-arrow.png'),
    alt: 'Left Arrow',
    title: 'Previous',
    className: 'icon-left-arrow'
  },
  rightArrow: {
    src: assetPath('assets/icons/right-arrow.png'),
    alt: 'Right Arrow',
    title: 'Next',
    className: 'icon-right-arrow'
  },
  star: {
    src: assetPath('assets/icons/star.png'),
    alt: 'Star',
    title: 'Star',
    className: 'icon-star'
  },
  copy: {
    src: assetPath('assets/icons/copy.svg'),
    alt: 'Copy',
    title: 'Copy to clipboard',
    className: 'icon-copy'
  },
  tick: {
    src: assetPath('assets/icons/tick.svg'),
    alt: 'Tick',
    title: 'Copied',
    className: 'icon-tick'
  },
  autocad: {
    src: assetPath('assets/icons/autocad.svg'),
    alt: 'AutoCAD',
    title: 'AutoCAD',
  },
    python: {
    src: assetPath('assets/icons/python.svg'),
    alt: 'Python',
    title: 'Python',
  },
  revit: {
    src: assetPath('assets/icons/revit.svg'),
    alt: 'Revit',
    title: 'Revit',
  },
    photoshop: {
    src: assetPath('assets/icons/photoshop.svg'),
    alt: 'Photoshop',
    title: 'Photoshop',
  },
    illustrator: {
    src: assetPath('assets/icons/illustrator.svg'),
    alt: 'Illustrator',
    title: 'Illustrator',
  },
    indesign: {
    src: assetPath('assets/icons/indesign.svg'),
    alt: 'Indesign',
    title: 'Indesign',
  },
    aftereffects: {
    src: assetPath('assets/icons/aftereffects.svg'),
    alt: 'After Effects',
    title: 'After Effects',
  },
    lightroom: {
    src: assetPath('assets/icons/lightroom.svg'),
    alt: 'Lightroom',
    title: 'Lightroom',
  },
  unreal: {
    src: assetPath('assets/icons/unreal.svg'),
    alt: 'Unreal Engine',
    title: 'Unreal Engine',
  },
  twinmotion: {
    src: assetPath('assets/icons/twinmotion.svg'),
    alt: 'Twinmotion',
    title: 'Twinmotion',
  },
  lumion: {
    src: assetPath('assets/icons/lumion.svg'),
    alt: 'Lumion',
    title: 'Lumion',
  },
  rhino: {
    src: assetPath('assets/icons/rhino.svg'),
    alt: 'Rhino',
    title: 'Rhino',
  },
  grasshopper: {
    src: assetPath('assets/icons/grasshopper.svg'),
    alt: 'Grasshopper',
    title: 'Grasshopper',
  },
  adobe: {
    src: assetPath('assets/icons/adobe.svg'),
    alt: 'Adobe Creative Suite',
    title: 'Adobe Creative Suite',
  },
  comfyui: {
    src: assetPath('assets/icons/comfyui.svg'),
    alt: 'ComfyUI',
    title: 'ComfyUI',
  },
  davinci: {
    src: assetPath('assets/icons/davinci.svg'),
    alt: 'DaVinci Resolve',
    title: 'DaVinci Resolve',
  },
};