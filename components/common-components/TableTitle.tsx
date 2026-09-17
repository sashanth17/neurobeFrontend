import React from 'react'

const TableTitle = (props) => {
  const {title, label, subLabel}=props
  return (
    <div className='flex justify-between'>
        <div className='section-ti ps-2'>{title}</div>
        {label && subLabel &&
        <div className='text-pri text-xs font-semibold'><span>{label} </span> • <span> {subLabel}</span></div>
      }
        </div>
  )
}

export default TableTitle