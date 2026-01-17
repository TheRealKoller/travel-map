import { Tour } from '@/types/tour';
import { Trip } from '@/types/trip';
import { useCallback, useReducer } from 'react';

interface ModalState {
    isCreateTripModalOpen: boolean;
    isRenameTripModalOpen: boolean;
    isDeleteTripDialogOpen: boolean;
    isCreateTourModalOpen: boolean;
    isDeleteTourDialogOpen: boolean;
    tripToRename: Trip | null;
    tripToDelete: Trip | null;
    tourToDelete: Tour | null;
}

type ModalAction =
    | { type: 'OPEN_CREATE_TRIP' }
    | { type: 'CLOSE_CREATE_TRIP' }
    | { type: 'OPEN_RENAME_TRIP'; trip: Trip }
    | { type: 'CLOSE_RENAME_TRIP' }
    | { type: 'OPEN_DELETE_TRIP'; trip: Trip }
    | { type: 'CLOSE_DELETE_TRIP' }
    | { type: 'OPEN_CREATE_TOUR' }
    | { type: 'CLOSE_CREATE_TOUR' }
    | { type: 'OPEN_DELETE_TOUR'; tour: Tour }
    | { type: 'CLOSE_DELETE_TOUR' };

const initialState: ModalState = {
    isCreateTripModalOpen: false,
    isRenameTripModalOpen: false,
    isDeleteTripDialogOpen: false,
    isCreateTourModalOpen: false,
    isDeleteTourDialogOpen: false,
    tripToRename: null,
    tripToDelete: null,
    tourToDelete: null,
};

function modalReducer(state: ModalState, action: ModalAction): ModalState {
    switch (action.type) {
        case 'OPEN_CREATE_TRIP':
            return { ...state, isCreateTripModalOpen: true };
        case 'CLOSE_CREATE_TRIP':
            return { ...state, isCreateTripModalOpen: false };
        case 'OPEN_RENAME_TRIP':
            return {
                ...state,
                isRenameTripModalOpen: true,
                tripToRename: action.trip,
            };
        case 'CLOSE_RENAME_TRIP':
            return {
                ...state,
                isRenameTripModalOpen: false,
                tripToRename: null,
            };
        case 'OPEN_DELETE_TRIP':
            return {
                ...state,
                isDeleteTripDialogOpen: true,
                tripToDelete: action.trip,
            };
        case 'CLOSE_DELETE_TRIP':
            return {
                ...state,
                isDeleteTripDialogOpen: false,
                tripToDelete: null,
            };
        case 'OPEN_CREATE_TOUR':
            return { ...state, isCreateTourModalOpen: true };
        case 'CLOSE_CREATE_TOUR':
            return { ...state, isCreateTourModalOpen: false };
        case 'OPEN_DELETE_TOUR':
            return {
                ...state,
                isDeleteTourDialogOpen: true,
                tourToDelete: action.tour,
            };
        case 'CLOSE_DELETE_TOUR':
            return {
                ...state,
                isDeleteTourDialogOpen: false,
                tourToDelete: null,
            };
        default:
            return state;
    }
}

export function useModalState() {
    const [state, dispatch] = useReducer(modalReducer, initialState);

    const openCreateTripModal = useCallback(() => {
        dispatch({ type: 'OPEN_CREATE_TRIP' });
    }, []);

    const closeCreateTripModal = useCallback(() => {
        dispatch({ type: 'CLOSE_CREATE_TRIP' });
    }, []);

    const openRenameTripModal = useCallback((trip: Trip) => {
        dispatch({ type: 'OPEN_RENAME_TRIP', trip });
    }, []);

    const closeRenameTripModal = useCallback(() => {
        dispatch({ type: 'CLOSE_RENAME_TRIP' });
    }, []);

    const openDeleteTripDialog = useCallback((trip: Trip) => {
        dispatch({ type: 'OPEN_DELETE_TRIP', trip });
    }, []);

    const closeDeleteTripDialog = useCallback(() => {
        dispatch({ type: 'CLOSE_DELETE_TRIP' });
    }, []);

    const openCreateTourModal = useCallback(() => {
        dispatch({ type: 'OPEN_CREATE_TOUR' });
    }, []);

    const closeCreateTourModal = useCallback(() => {
        dispatch({ type: 'CLOSE_CREATE_TOUR' });
    }, []);

    const openDeleteTourDialog = useCallback((tour: Tour) => {
        dispatch({ type: 'OPEN_DELETE_TOUR', tour });
    }, []);

    const closeDeleteTourDialog = useCallback(() => {
        dispatch({ type: 'CLOSE_DELETE_TOUR' });
    }, []);

    return {
        state,
        openCreateTripModal,
        closeCreateTripModal,
        openRenameTripModal,
        closeRenameTripModal,
        openDeleteTripDialog,
        closeDeleteTripDialog,
        openCreateTourModal,
        closeCreateTourModal,
        openDeleteTourDialog,
        closeDeleteTourDialog,
    } as const;
}
