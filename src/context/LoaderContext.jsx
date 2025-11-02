import React, { createContext, useState, useContext } from 'react'
import Loader from '../components/Loader'

const LoaderContext = createContext()

export const LoaderProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [loadingText, setLoadingText] = useState('Loading...')

    const showLoader = (text = 'Loading...') => {
        setLoadingText(text)
        setLoading(true)
    }

    const hideLoader = () => {
        setLoading(false)
    }

    return (
        <LoaderContext.Provider value={{ showLoader, hideLoader }}>
            {children}
            {loading && <Loader text={loadingText} />}
        </LoaderContext.Provider>
    )
}

export const useLoader = () => useContext(LoaderContext)