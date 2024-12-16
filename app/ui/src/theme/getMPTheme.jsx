import { getDesignTokens } from './themePrimitives';
import {
  dataDisplayCustomizations,
  feedbackCustomizations,
} from './customizations';

export default function getMPTheme(mode) {
  return {
    ...getDesignTokens(mode),
    components: {
      ...dataDisplayCustomizations,
      ...feedbackCustomizations,
    },
  };
}
