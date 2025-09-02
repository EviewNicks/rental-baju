import React from 'react'

interface VisuallyHiddenProps {
  children: React.ReactNode
  asChild?: boolean
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({ 
  children, 
  asChild = false 
}) => {
  const Component = asChild ? React.Fragment : 'span'
  
  const visuallyHiddenStyles = {
    position: 'absolute' as const,
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap' as const,
    border: '0'
  }

  if (asChild) {
    return (
      <>{React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, {
            ...child.props,
            style: { ...child.props.style, ...visuallyHiddenStyles }
          })
        }
        return child
      })}</>
    )
  }

  return (
    <Component style={visuallyHiddenStyles}>
      {children}
    </Component>
  )
}

VisuallyHidden.displayName = 'VisuallyHidden'