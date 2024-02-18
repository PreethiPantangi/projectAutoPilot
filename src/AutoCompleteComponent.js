import { Autocomplete } from '@react-google-maps/api'
import React from 'react'

const AutoCompleteComponent = ({id, placeholder, className, onLoad, onPlaceChanged}) => {
  return (
    <Autocomplete onLoad={onLoad} onPlaceChanged={onPlaceChanged}>
        <input
          type="text"
          id={id}
          className={className}
          placeholder={placeholder}
          style={{border: '1px solid black', padding:'5px'}}
        />
      </Autocomplete>
  )
}

export default AutoCompleteComponent