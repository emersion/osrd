package fr.sncf.osrd.infra;

import java.util.Map;

/**
 * A sequence of points delimiting a continuous stair.
 * @param <E> The type of the point objects
 */
public final class StairSequence<E> extends SortedSequence<E> {
    public final class Cursor {
        private int currentIndex = 0;
        private StairSequence<E> seq;

        public Cursor(StairSequence<E> seq) {
            this.seq = seq;
        }

        public Map.Entry<Double, E> at() {
            return this.seq.data.get(currentIndex);
        }

        public double position() {
            return at().getKey();
        }

        public E value() {
            return at().getValue();
        }

        /**
         * Moves the cursor forward until the given position is reached.
         */
        public void advanceUntil(double targetPosition) {
            assert targetPosition > position();
            var data = this.seq.data;
            while (currentIndex < data.size() - 1) {
                if (position() > targetPosition)
                    break;
                currentIndex++;
            }
        }
    }

    public Cursor cursor() {
        return new Cursor(this);
    }
}