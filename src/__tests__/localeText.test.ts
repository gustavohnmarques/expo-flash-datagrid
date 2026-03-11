import {
  EN_LOCALE_TEXT,
  PT_LOCALE_TEXT,
  resolveLocaleText,
} from '../localization/localeText';

describe('locale text', () => {
  it('uses the updated empty label defaults', () => {
    expect(EN_LOCALE_TEXT.emptyLabel).toBe('No records found');
    expect(PT_LOCALE_TEXT.emptyLabel).toBe('Nenhum registro encontrado');
  });

  it('allows overriding the empty label', () => {
    const localeText = resolveLocaleText('pt', {
      emptyLabel: 'Lista vazia personalizada',
    });

    expect(localeText.emptyLabel).toBe('Lista vazia personalizada');
    expect(localeText.rowsPerPage).toBe('Linhas por pagina');
  });
});
