import { notFound } from 'next/navigation';

/**
 * @fileOverview File ini dihapus karena konflik dengan folder [username].
 * Menghindari 404 akibat tabrakan rute dinamis.
 */
export default function DeletedSlugPage() {
  return notFound();
}
