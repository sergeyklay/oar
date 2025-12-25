import {
  escapeCssIdentifier,
  sanitizeColorValue,
} from './chart';

describe('escapeCssIdentifier', () => {
  it('preserves alphanumeric characters and hyphens', () => {
    expect(escapeCssIdentifier('chart-123')).toBe('chart-123');
    expect(escapeCssIdentifier('myChart_123')).toBe('myChart_123');
    expect(escapeCssIdentifier('abc123')).toBe('abc123');
  });

  it('removes characters that break CSS syntax', () => {
    expect(escapeCssIdentifier('chart:id')).toBe('chartid');
    expect(escapeCssIdentifier('chart@name')).toBe('chartname');
    expect(escapeCssIdentifier('chart.name')).toBe('chartname');
    expect(escapeCssIdentifier('chart name')).toBe('chartname');
  });

  it('removes special characters that could inject CSS', () => {
    expect(escapeCssIdentifier('chart{value}')).toBe('chartvalue');
    expect(escapeCssIdentifier('chart[selector]')).toBe('chartselector');
    expect(escapeCssIdentifier('chart(value)')).toBe('chartvalue');
    expect(escapeCssIdentifier('chart;value')).toBe('chartvalue');
  });

  it('handles empty strings', () => {
    expect(escapeCssIdentifier('')).toBe('');
  });

  it('handles strings with only special characters', () => {
    expect(escapeCssIdentifier('!@#$%')).toBe('');
    expect(escapeCssIdentifier('{}[]()')).toBe('');
  });

  it('preserves underscores and hyphens', () => {
    expect(escapeCssIdentifier('chart-id_test')).toBe('chart-id_test');
    expect(escapeCssIdentifier('__chart__')).toBe('__chart__');
    expect(escapeCssIdentifier('---test---')).toBe('---test---');
  });
});

describe('sanitizeColorValue', () => {
  describe('CSS custom properties', () => {
    it('allows valid var() syntax', () => {
      expect(sanitizeColorValue('var(--primary)')).toBe('var(--primary)');
      expect(sanitizeColorValue('var(--chart-1)')).toBe('var(--chart-1)');
      expect(sanitizeColorValue('var(--color-name_123)')).toBe('var(--color-name_123)');
    });

    it('rejects invalid var() syntax', () => {
      expect(sanitizeColorValue('var(--primary))')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('var(primary)')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('var(--primary;')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('var(--primary})')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('nested functions', () => {
    it('allows hsl(var(--name))', () => {
      expect(sanitizeColorValue('hsl(var(--primary))')).toBe('hsl(var(--primary))');
      expect(sanitizeColorValue('hsl(var(--chart-1))')).toBe('hsl(var(--chart-1))');
    });

    it('allows rgb(var(--name))', () => {
      expect(sanitizeColorValue('rgb(var(--color))')).toBe('rgb(var(--color))');
    });

    it('allows rgba(var(--name))', () => {
      expect(sanitizeColorValue('rgba(var(--color))')).toBe('rgba(var(--color))');
    });

    it('rejects invalid nested functions', () => {
      expect(sanitizeColorValue('hsl(var(primary))')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('hsl(var(--primary)))')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('hsl(var(--primary);')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('HSL/RGB/RGBA functions with numeric values', () => {
    it('allows hsl() with numeric values', () => {
      expect(sanitizeColorValue('hsl(200, 50%, 50%)')).toBe('hsl(200, 50%, 50%)');
      expect(sanitizeColorValue('hsl(200,50%,50%)')).toBe('hsl(200,50%,50%)');
      expect(sanitizeColorValue('hsl(200 50% 50%)')).toBe('hsl(200 50% 50%)');
    });

    it('allows rgb() with numeric values', () => {
      expect(sanitizeColorValue('rgb(255, 128, 0)')).toBe('rgb(255, 128, 0)');
      expect(sanitizeColorValue('rgb(255,128,0)')).toBe('rgb(255,128,0)');
    });

    it('allows rgba() with numeric values', () => {
      expect(sanitizeColorValue('rgba(255, 128, 0, 0.5)')).toBe('rgba(255, 128, 0, 0.5)');
      expect(sanitizeColorValue('rgba(255,128,0,0.5)')).toBe('rgba(255,128,0,0.5)');
    });

    it('rejects functions with unsafe characters', () => {
      expect(sanitizeColorValue('rgb(255, 128, url("evil"))')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('hsl(200, 50%, calc(100%))')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('hex colors', () => {
    it('allows 3-digit hex colors', () => {
      expect(sanitizeColorValue('#fff')).toBe('#fff');
      expect(sanitizeColorValue('#000')).toBe('#000');
      expect(sanitizeColorValue('#abc')).toBe('#abc');
    });

    it('allows 4-digit hex colors', () => {
      expect(sanitizeColorValue('#ffff')).toBe('#ffff');
      expect(sanitizeColorValue('#0000')).toBe('#0000');
    });

    it('allows 6-digit hex colors', () => {
      expect(sanitizeColorValue('#ffffff')).toBe('#ffffff');
      expect(sanitizeColorValue('#000000')).toBe('#000000');
      expect(sanitizeColorValue('#ff0000')).toBe('#ff0000');
    });

    it('allows 8-digit hex colors', () => {
      expect(sanitizeColorValue('#ffffffff')).toBe('#ffffffff');
      expect(sanitizeColorValue('#00000000')).toBe('#00000000');
    });

    it('rejects invalid hex colors', () => {
      expect(sanitizeColorValue('#gg')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('#ffffg')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('#ff')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('#fffffff')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('named colors', () => {
    it('allows safe named colors', () => {
      expect(sanitizeColorValue('transparent')).toBe('transparent');
      expect(sanitizeColorValue('currentColor')).toBe('currentcolor');
      expect(sanitizeColorValue('inherit')).toBe('inherit');
      expect(sanitizeColorValue('initial')).toBe('initial');
      expect(sanitizeColorValue('unset')).toBe('unset');
    });

    it('normalizes case for named colors', () => {
      expect(sanitizeColorValue('TRANSPARENT')).toBe('transparent');
      expect(sanitizeColorValue('CurrentColor')).toBe('currentcolor');
      expect(sanitizeColorValue('INHERIT')).toBe('inherit');
      expect(sanitizeColorValue('INITIAL')).toBe('initial');
      expect(sanitizeColorValue('UNSET')).toBe('unset');
    });

    it('rejects unsafe named colors', () => {
      expect(sanitizeColorValue('red')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('blue')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('green')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('trimming', () => {
    it('trims whitespace', () => {
      expect(sanitizeColorValue('  var(--primary)  ')).toBe('var(--primary)');
      expect(sanitizeColorValue('\n\thsl(var(--chart-1))\t\n')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('  #fff  ')).toBe('#fff');
    });
  });

  describe('CSS injection prevention', () => {
    it('rejects CSS injection attempts in color values', () => {
      expect(sanitizeColorValue('red; } body { background: url(evil) } div {')).toBe(
        'hsl(var(--chart-1))'
      );
      expect(sanitizeColorValue('red } body {')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('red; } /* */')).toBe('hsl(var(--chart-1))');
    });

    it('rejects CSS functions that could be dangerous', () => {
      expect(sanitizeColorValue('url("evil")')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('calc(100% + 10px)')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('expression(evil)')).toBe('hsl(var(--chart-1))');
    });

    it('rejects empty strings', () => {
      expect(sanitizeColorValue('')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('   ')).toBe('hsl(var(--chart-1))');
    });
  });

  describe('fallback behavior', () => {
    it('returns fallback for completely invalid input', () => {
      expect(sanitizeColorValue('not-a-color')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('123abc')).toBe('hsl(var(--chart-1))');
      expect(sanitizeColorValue('!!@#$%')).toBe('hsl(var(--chart-1))');
    });
  });
});

