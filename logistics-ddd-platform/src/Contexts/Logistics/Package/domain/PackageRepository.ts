import { Package } from './Package';
import { PackageId } from './PackageId';

/**
 * PackageRepository
 *
 * Defines the contract for a repository that manages Package aggregates.
 *
 * Responsibilities:
 * - Abstracts data persistence and retrieval
 * - Provides a consistent interface for working with Package aggregates
 * - Keeps domain logic separate from infrastructure details (like databases)
 */
export interface PackageRepository {
  /**
   * Save a Package aggregate.
   * Can be used for both creating new packages or updating existing ones.
   * 
   * @param pkg - the Package aggregate to persist
   */
  save(pkg: Package): Promise<void>;

  /**
   * Find a Package by its unique identifier.
   * 
   * @param id - the PackageId of the aggregate
   * @returns the Package aggregate if found, or null if not
   */
  find(id: PackageId): Promise<Package | null>;

  /**
   * Find a Package by its tracking number.
   * 
   * @param trackingNumber - the tracking number to search for
   * @returns the Package aggregate if found, or null if not
   */
  findByTrackingNumber(trackingNumber: string): Promise<Package | null>;

  /**
   * Find all Package aggregates.
   * 
   * @returns array of all Package aggregates
   */
  findAll(): Promise<Package[]>;

  /**
   * Delete a Package aggregate by its ID.
   * 
   * @param id - the PackageId of the aggregate to delete
   */
  delete(id: PackageId): Promise<void>;
}