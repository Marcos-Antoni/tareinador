import { AnimatePresence, motion } from "framer-motion";

export default function LoadingOverlay({ visible, message }) {
    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="loading-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <div className="loading-spinner" />
                    <motion.p
                        key={message}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {message}
                    </motion.p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
