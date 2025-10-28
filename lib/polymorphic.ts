import React from 'react'

// Utilidades simples para componentes polimórficos.
// Usamos `Record<string, unknown>` como tipo por defecto para evitar la regla
// sobre `{}` y mantener un tipo de objeto genérico seguro.
export type AsProp<C extends React.ElementType> = { as?: C }

export type PropsWithAs<C extends React.ElementType, P = Record<string, unknown>> =
	P & AsProp<C> & Omit<React.ComponentPropsWithoutRef<C>, keyof P | 'as'>

export type PolymorphicRef<C extends React.ElementType> = React.ComponentPropsWithRef<C>['ref']

export type PolymorphicComponentProps<C extends React.ElementType, P = Record<string, unknown>> = PropsWithAs<C, P>

export default {} as const
