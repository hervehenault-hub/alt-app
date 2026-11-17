import { render, screen } from '@testing-library/react-native';
import { Leaf } from 'lucide-react-native';

import { Icon } from '@/components/Icon';

describe('Icon', () => {
  it('est décorative (masquée) sans libellé', async () => {
    await render(<Icon icon={Leaf} testID="deco" />);
    expect(screen.queryByRole('image')).toBeNull();
    expect(screen.getByTestId('deco', { includeHiddenElements: true })).toBeTruthy();
  });

  it('est annoncée comme image avec un libellé', async () => {
    await render(<Icon icon={Leaf} label="Feuille" />);
    expect(screen.getByRole('image', { name: 'Feuille' })).toBeOnTheScreen();
  });
});
