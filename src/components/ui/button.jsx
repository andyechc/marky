import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

const variantClasses = {
  primary:
    'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:bg-primary/95',
  secondary:
    'bg-surface-muted text-foreground hover:bg-surface-subtle border border-border',
  outline:
    'border border-border bg-transparent text-foreground hover:bg-surface-muted',
  ghost: 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
  danger: 'bg-destructive text-primary-foreground shadow-sm hover:bg-destructive/90',
}

const sizeClasses = {
  sm: 'h-8 gap-1.5 rounded-md px-2.5 text-[13px]',
  md: 'h-9 gap-2 rounded-md px-3 text-sm',
  lg: 'h-11 gap-2 rounded-lg px-5 text-[15px]',
  icon: 'h-9 w-9 rounded-md',
  'icon-sm': 'h-8 w-8 rounded-md',
}

const Button = forwardRef(function Button(
  { className, variant = 'secondary', size = 'md', asChild = false, type, ...props },
  ref,
) {
  const Component = asChild ? 'span' : 'button'

  return (
    <Component
      ref={ref}
      // Buttons inside forms default to submit, which causes surprises.
      type={asChild ? undefined : (type ?? 'button')}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium',
        'transition-[background-color,color,box-shadow,border-color] duration-150',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
        'disabled:pointer-events-none disabled:opacity-45',
        '[&_svg]:pointer-events-none [&_svg]:shrink-0',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
})

export { Button, variantClasses, sizeClasses }