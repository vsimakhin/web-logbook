package models

import (
	"context"
	"database/sql"
	"time"
)

// GetDeletedItems returns deleted items
func (m *DBModel) GetDeletedItems() ([]DeletedItem, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	var di DeletedItem
	var dis []DeletedItem

	query := "SELECT uuid, table_name, delete_time FROM deleted_items"
	rows, err := m.DB.QueryContext(ctx, query)
	if err != nil {
		return dis, err
	}
	defer rows.Close()

	for rows.Next() {
		err = rows.Scan(&di.UUID, &di.TableName, &di.DeleteTime)

		if err != nil {
			return dis, err
		}
		dis = append(dis, di)
	}

	return dis, nil
}

// SyncUploadedFlightRecords synchronizes the uploaded flight records from mobile app
func (m *DBModel) SyncUploadedFlightRecords(frs []FlightRecord) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	for _, fr := range frs {
		query := "SELECT uuid, update_time FROM logbook WHERE uuid = ?"
		row := m.DB.QueryRowContext(ctx, query, fr.UUID)

		var currentFR FlightRecord

		err := row.Scan(&currentFR.UUID, &currentFR.UpdateTime)
		if err != nil {
			if err == sql.ErrNoRows {
				err = m.InsertFlightRecord(fr)
				if err != nil {
					return err
				}

			} else {
				return err
			}
		}
		if currentFR.UpdateTime < fr.UpdateTime {
			err = m.UpdateFlightRecord(fr)
			if err != nil {
				return err
			}

		}
	}

	return nil
}

// SyncDeletedItems removes the records from the tables
func (m *DBModel) SyncDeletedItems(dis []DeletedItem) error {
	for _, di := range dis {
		if di.TableName == "logbook" {
			// remove the flight record by uuid. It also will add uuid to the
			// deleted_items for the main app, in case there are several
			// mobile devices to sync
			err := m.DeleteFlightRecord(di.UUID)
			if err != nil {
				return err
			}
		} else if di.TableName == "attachments" {
			err := m.DeleteAttachment(di.UUID)
			if err != nil {
				return err
			}
		}
	}

	return nil
}

// SyncCleanUp cleanup older records from deleted_items table
func (m *DBModel) SyncCleanUp() error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	settings, err := m.GetSettings()
	if err != nil {
		return err
	}

	var keepOldRecords int64 = 30 // let's make it as a default value if user didn't set anyting
	if settings.SyncOptions.KeepDeletedRecordsDays != 0 {
		keepOldRecords = settings.SyncOptions.KeepDeletedRecordsDays
	}
	oldRecordsTime := time.Now().Unix() - keepOldRecords*24*3600

	_, err = m.DB.ExecContext(ctx, "DELETE FROM deleted_items WHERE delete_time < ?", oldRecordsTime)
	if err != nil {
		return err
	}

	return nil

}

func (m *DBModel) SyncUploadedLicenses(lics []License) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	for _, lic := range lics {
		query := "SELECT uuid, update_time FROM licensing WHERE uuid = ?"
		row := m.DB.QueryRowContext(ctx, query, lic.UUID)

		var currentLic License

		err := row.Scan(&currentLic.UUID, &currentLic.UpdateTime)
		if err != nil {
			if err == sql.ErrNoRows {
				err = m.InsertLicenseRecord(lic)
				if err != nil {
					return err
				}

			} else {
				return err
			}
		}
		if currentLic.UpdateTime < lic.UpdateTime {
			err = m.UpdateLicenseRecord(lic)
			if err != nil {
				return err
			}

		}
	}

	return nil
}
