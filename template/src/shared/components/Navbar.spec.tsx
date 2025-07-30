import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import Navbar from './Navbar'

describe('Navbar', () => {
    it('render page', () => {
        render(<Navbar />)
        expect(screen.getAllByText('Navbar')).toHaveLength(1)
    })
})
