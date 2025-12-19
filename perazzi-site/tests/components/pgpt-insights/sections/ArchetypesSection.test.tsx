const { render, screen } = require('@testing-library/react');
const ArchetypesSection = require('../../../../../src/components/pgpt-insights/sections/ArchetypesSection');

test('renders ArchetypesSection', () => {
    render(<ArchetypesSection />);
    const element = screen.getByText(/some text in ArchetypesSection/i);
    expect(element).toBeInTheDocument();
});