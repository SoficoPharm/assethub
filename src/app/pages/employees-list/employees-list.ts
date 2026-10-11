import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { EmployeeRow, EmployeesService } from '../../services/employees.service';

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './employees-list.html',
  styleUrls: ['./employees-list.scss']
})
export class EmployeesList implements OnInit {
  protected readonly auth = inject(AuthService);

  searchText = '';
  users: EmployeeRow[] = [];

  loading = false;
  errorMessage = '';

  constructor(
    private readonly employeesService: EmployeesService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.errorMessage = '';

    this.employeesService.getEmployees()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.users = res ?? [];
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Employees error:', err);
          this.errorMessage = `Failed to load employees. Status: ${err.status || 'error'}`;
        }
      });
  }

  openImage(url?: string): void {
    if (!url) return;
    window.open(url, '_blank');
  }

  get filteredUsers(): EmployeeRow[] {
    const search = this.searchText.trim().toLowerCase();

    return this.users.filter(user => {
      const name = user.name ?? '';
      const email = user.email ?? '';
      const employeeId = user.employeeId ?? '';
      const userDomain = user.userDomain ?? '';
      const department = user.department ?? '';
      const title = user.title ?? '';

      return (
        !search ||
        name.toLowerCase().includes(search) ||
        email.toLowerCase().includes(search) ||
        employeeId.toLowerCase().includes(search) ||
        userDomain.toLowerCase().includes(search) ||
        department.toLowerCase().includes(search) ||
        title.toLowerCase().includes(search)
      );
    });
  }
}