import { ref } from 'vue'
export const useLoading = () => {
    const isLoading = ref(false)
    const setLoading = (loading: boolean) => {
        isLoading.value = loading
    }
    return {
        isLoading,
        setLoading,
    }
}